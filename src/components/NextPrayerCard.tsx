'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Bell, ChevronDown } from 'lucide-react';
import { calculatePrayerCountdown } from '@/lib/prayerTracker';
import { BD_LOCATION_PRESETS, BDLocationPreset } from '@/lib/geoUtils';
import { getHijriDate, getDailyWisdom, playSoftChime } from '@/lib/islamicUtils';
import { useMounted } from '@/lib/useMounted';

interface NextPrayerCardProps {
  currentLocation: {
    lat: number;
    lng: number;
    area: string;
    isGps: boolean;
  };
  onLocationChange: (loc: { lat: number; lng: number; area: string; isGps: boolean }) => void;
  onRequestGps: () => void;
  gpsLoading: boolean;
  activeMosquePrayer?: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string;
  };
  lang: 'en' | 'bn';
}

const DEFAULT_PRAYER_SCHEDULE = {
  fajr: '05:10 AM',
  dhuhr: '01:15 PM',
  asr: '04:25 PM',
  maghrib: '06:10 PM',
  isha: '08:00 PM',
  jummah: '01:30 PM'
};

// Deterministic reference date for SSR to ensure server and initial client render match identically
const DETERMINISTIC_SSR_DATE = new Date('2026-03-01T10:00:00.000Z');

export function NextPrayerCard({
  currentLocation,
  onLocationChange,
  onRequestGps,
  gpsLoading,
  activeMosquePrayer = DEFAULT_PRAYER_SCHEDULE,
  lang
}: NextPrayerCardProps) {
  const mounted = useMounted();
  const [currentTime, setCurrentTime] = useState<Date>(DETERMINISTIC_SSR_DATE);
  const [showAreaPicker, setShowAreaPicker] = useState<boolean>(false);

  useEffect(() => {
    // Only start live clock after mounting on client
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tracking = calculatePrayerCountdown(activeMosquePrayer, currentTime);

  // Deterministic values for SSR, live values for client after mounting
  const formattedCurrentTime = mounted
    ? currentTime.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : '--:--:-- BST';

  const hijri = mounted ? getHijriDate(currentTime) : { formattedBn: 'রমজান ১৪৪৭', formattedEn: 'Ramadan 1447 AH' };
  const wisdom = getDailyWisdom();

  return (
    <div className="space-y-4">
      {/* 1. CURRENT LOCATION CARD */}
      <div className="bg-white border border-[#E2E8E4] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Location & Hijri Date */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#5F6B64] uppercase tracking-wider">
                {lang === 'bn' ? 'বর্তমান অবস্থান' : 'CURRENT LOCATION'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#854D0E] bg-[#FEF9C3] px-2.5 py-0.5 rounded-full border border-[#FDE047]/60">
                <span>🌙</span>
                <span>{lang === 'bn' ? hijri.formattedBn : hijri.formattedEn}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F0F7F4] text-[#0B3B2C] border border-[#C2DFD2] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#0B3B2C]" />
              </div>
              <button
                type="button"
                onClick={() => setShowAreaPicker(!showAreaPicker)}
                className="font-bold text-base sm:text-lg text-[#18211C] hover:text-[#0B3B2C] transition-colors flex items-center gap-1.5 text-left"
                aria-label={lang === 'bn' ? `এলাকা পরিবর্তন করুন (বর্তমান: ${currentLocation.area})` : `Change area (Current: ${currentLocation.area})`}
                aria-expanded={showAreaPicker}
              >
                <span>{currentLocation.area}</span>
                <ChevronDown className={`w-4 h-4 text-[#5F6B64] transition-transform ${showAreaPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: GPS Trigger & Live Clock */}
          <div className="flex items-center gap-3 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E8E4]">
            <button
              onClick={onRequestGps}
              disabled={gpsLoading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all touch-target-44 ${
                currentLocation.isGps
                  ? 'bg-[#F0F7F4] text-[#0B3B2C] border-[#C2DFD2] shadow-xs'
                  : 'bg-white hover:bg-[#F0F7F4] text-[#18211C] border-[#E2E8E4]'
              }`}
              title="Use precise GPS location"
              aria-label={lang === 'bn' ? 'সরাসরি জিপিএস অবস্থান ব্যবহার করুন' : 'Use live GPS location'}
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-[#0B3B2C]' : 'text-[#5F6B64]'}`} />
              <span>
                {gpsLoading
                  ? (lang === 'bn' ? 'শনাক্ত হচ্ছে...' : 'Locating...')
                  : (currentLocation.isGps ? (lang === 'bn' ? 'জিপিএস সক্রিয়' : 'GPS Live') : (lang === 'bn' ? 'জিপিএস ব্যবহার করুন' : 'Use GPS'))}
              </span>
            </button>

            <div className="h-6 w-px bg-[#E2E8E4] hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-[#5F6B64] font-medium">
                  {lang === 'bn' ? 'লাইভ সময় (BST)' : 'Live BST Time'}
                </div>
                <div className="text-sm font-mono font-bold text-[#18211C]">
                  {formattedCurrentTime}
                </div>
              </div>
              <button
                type="button"
                onClick={() => playSoftChime()}
                className="p-2 rounded-xl text-[#5F6B64] hover:text-[#0B3B2C] hover:bg-[#F0F7F4] transition-colors touch-target-44 flex items-center justify-center"
                title={lang === 'bn' ? 'নরম অ্যালার্ট সাউন্ড টেস্ট করুন' : 'Test Soft Chime'}
                aria-label={lang === 'bn' ? 'নরম নামাজের নোটিফিকেশন সাউন্ড টেস্ট করুন' : 'Test prayer notification sound'}
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Area Quick Switcher Dropdown */}
        {showAreaPicker && (
          <div 
            className="mt-3.5 pt-3 border-t border-[#E2E8E4] grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150"
            role="region"
            aria-label="Select Bangladesh Area Preset"
          >
            {BD_LOCATION_PRESETS.map((preset: BDLocationPreset) => (
              <button
                key={preset.name}
                onClick={() => {
                  onLocationChange({
                    lat: preset.lat,
                    lng: preset.lng,
                    area: lang === 'bn' ? preset.nameBn : preset.name,
                    isGps: false
                  });
                  setShowAreaPicker(false);
                }}
                className={`text-left px-3 py-2.5 rounded-xl text-xs transition-colors border touch-target-44 ${
                  currentLocation.area.includes(preset.area)
                    ? 'bg-[#0B3B2C] text-white border-[#0B3B2C] font-semibold shadow-xs'
                    : 'bg-white hover:bg-[#F0F7F4] text-[#5F6B64] border-[#E2E8E4]'
                }`}
                aria-pressed={currentLocation.area.includes(preset.area)}
              >
                <div className="truncate font-medium">{lang === 'bn' ? preset.nameBn : preset.name}</div>
                <div className={`text-[10px] truncate ${currentLocation.area.includes(preset.area) ? 'text-emerald-200' : 'text-[#88948D]'}`}>
                  {preset.area}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. NEXT PRAYER HERO CARD */}
      <div className="bg-gradient-to-br from-[#0B3B2C] via-[#0D4433] to-[#07261C] border border-[#176B4D]/50 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-5">
        
        {/* Subtle Ambient Decorative Light */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#F3BA47]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#176B4D]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Two-Column Desktop Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Column: Label, Large Prayer Name & Start Time */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#F3BA47] tracking-wider uppercase flex items-center gap-1.5">
                <span>🕌</span>
                <span>
                  {mounted && tracking.isRunningNow
                    ? (lang === 'bn' ? 'চলমান ওয়াক্ত' : 'CURRENT PRAYER')
                    : (lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'NEXT PRAYER')}
                </span>
              </span>
              {mounted && tracking.isRunningNow && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3BA47] text-[#07261C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#07261C] animate-pulse" />
                  <span>{lang === 'bn' ? 'জামাত চলছে' : 'JAMAT IN PROGRESS'}</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                {mounted ? (lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn) : (lang === 'bn' ? 'যোহর' : 'Dhuhr')}
              </h2>
              <span className="text-sm text-emerald-100/90 font-medium">
                {lang === 'bn' ? 'শুরু: ' : 'Starts at '}
                <strong className="text-[#F3BA47] font-bold">
                  {mounted ? tracking.nextPrayerTimeFormatted : '01:15 PM'}
                </strong>
              </span>
            </div>
          </div>

          {/* Right Column: Countdown Box */}
          <div className="sm:text-right bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 sm:px-4 sm:py-2.5 self-start sm:self-auto">
            <div className="text-[11px] text-emerald-200/90 font-medium">
              {mounted && tracking.isRunningNow
                ? (lang === 'bn' ? 'পরবর্তী ওয়াক্ত পর্যন্ত' : 'Until next waqt')
                : (lang === 'bn' ? 'বাকি সময়' : 'Time remaining')}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#F3BA47] tracking-tight font-mono">
              {mounted ? (
                tracking.diffMinutes > 0
                  ? `${tracking.diffMinutes} ${lang === 'bn' ? 'মিনিট' : 'min remaining'}`
                  : `${tracking.diffSeconds} ${lang === 'bn' ? 'সেকেন্ড' : 'sec remaining'}`
              ) : '-- min'}
            </div>
            <div className="text-[10px] text-emerald-200/80 font-mono mt-0.5">
              {mounted ? tracking.countdownText : '--:--:--'}
            </div>
          </div>
        </div>

        {/* Five Prayer Times in ONE Clean High-Contrast Horizontal Row */}
        <div className="relative z-10 grid grid-cols-5 gap-2 pt-3 border-t border-white/15">
          {[
            { key: 'fajr', bn: 'ফজর', en: 'Fajr', time: activeMosquePrayer.fajr },
            { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr', time: activeMosquePrayer.dhuhr },
            { key: 'asr', bn: 'আসর', en: 'Asr', time: activeMosquePrayer.asr },
            { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: activeMosquePrayer.maghrib },
            { key: 'isha', bn: 'এশা', en: 'Isha', time: activeMosquePrayer.isha }
          ].map((w) => {
            const isTarget = mounted ? tracking.nextPrayer.key === w.key : w.key === 'dhuhr';
            return (
              <div
                key={w.key}
                className={`py-2.5 px-1.5 text-center rounded-xl transition-all border ${
                  isTarget
                    ? 'bg-[#F3BA47] text-[#07261C] border-[#FCD34D] shadow-md ring-2 ring-[#FCD34D]/40 font-bold'
                    : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
                }`}
              >
                <div className={`text-xs ${isTarget ? 'font-black text-[#07261C]' : 'font-semibold text-white'}`}>
                  {lang === 'bn' ? w.bn : w.en}
                </div>
                <div className={`text-[11px] font-mono mt-1 ${isTarget ? 'font-extrabold text-[#07261C]' : 'text-emerald-100/90'}`}>
                  {w.time.split(' ')[0]}
                  <span className="text-[9px] ml-0.5 opacity-80">{w.time.split(' ')[1]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hadith / Daily Reflection with Gold Accent */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-emerald-100/90">
          <div className="italic">
            <span className="text-[#F3BA47] mr-1">❝</span>
            <span>{lang === 'bn' ? wisdom.verseBn : wisdom.verseEn}</span>
            <span className="text-[#F3BA47] ml-1">❞</span>
          </div>
          <span className="text-[11px] text-[#F3BA47] font-semibold sm:text-right whitespace-nowrap">
            — {lang === 'bn' ? wisdom.sourceBn : wisdom.sourceEn}
          </span>
        </div>
      </div>
    </div>
  );
}
