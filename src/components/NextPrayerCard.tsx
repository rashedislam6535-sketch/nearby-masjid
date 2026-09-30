'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { MapPin, Navigation, Clock, Bell, ChevronDown } from 'lucide-react';
import { calculatePrayerCountdown } from '@/lib/prayerTracker';
import { BD_LOCATION_PRESETS, BDLocationPreset } from '@/lib/geoUtils';
import { getHijriDate, getDailyWisdom, playSoftChime } from '@/lib/islamicUtils';

const subscribeMounted = () => () => {};

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

export function NextPrayerCard({
  currentLocation,
  onLocationChange,
  onRequestGps,
  gpsLoading,
  activeMosquePrayer = {
    fajr: '05:10 AM',
    dhuhr: '01:15 PM',
    asr: '04:25 PM',
    maghrib: '06:10 PM',
    isha: '08:00 PM',
    jummah: '01:30 PM'
  },
  lang
}: NextPrayerCardProps) {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const [showAreaPicker, setShowAreaPicker] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tracking = calculatePrayerCountdown(activeMosquePrayer, currentTime);

  const formattedCurrentTime = mounted
    ? currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : '04:00:00 PM';

  const hijri = getHijriDate(currentTime);
  const wisdom = getDailyWisdom();

  return (
    <div className="space-y-4">
      {/* 1. HERO / CURRENT LOCATION CARD (Clean, Flat, Calm) */}
      <div className="bg-white border border-[#E4E9E5] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,24,20,0.04)] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Location & Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#66706A] uppercase tracking-wider">
                {lang === 'bn' ? 'বর্তমান অবস্থান' : 'Current Location'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-[#66706A]">
                {lang === 'bn' ? hijri.formattedBn : hijri.formattedEn}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#176B4D] flex-shrink-0" />
              <button
                type="button"
                onClick={() => setShowAreaPicker(!showAreaPicker)}
                className="font-bold text-base sm:text-lg text-[#18211C] hover:text-[#176B4D] transition-colors flex items-center gap-1.5"
                title="Change area"
              >
                <span>{currentLocation.area}</span>
                <ChevronDown className={`w-4 h-4 text-[#66706A] transition-transform ${showAreaPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: GPS Trigger & Live Clock */}
          <div className="flex items-center gap-3 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E9E5]">
            <button
              onClick={onRequestGps}
              disabled={gpsLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                currentLocation.isGps
                  ? 'bg-[#EEF6F2] text-[#176B4D] border-[#C2DFD2]'
                  : 'bg-white hover:bg-[#F8FAF9] text-[#18211C] border-[#E4E9E5]'
              }`}
              title="Use precise GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-[#176B4D]' : 'text-[#66706A]'}`} />
              <span>
                {gpsLoading
                  ? (lang === 'bn' ? 'শনাক্ত হচ্ছে...' : 'Locating...')
                  : (currentLocation.isGps ? (lang === 'bn' ? 'জিপিএস সক্রিয়' : 'GPS Live') : (lang === 'bn' ? 'জিপিএস ব্যবহার করুন' : 'Use GPS'))}
              </span>
            </button>

            <div className="h-6 w-px bg-[#E4E9E5] hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-[#66706A] font-medium">
                  {lang === 'bn' ? 'লাইভ সময় (BST)' : 'Live BST Time'}
                </div>
                <div suppressHydrationWarning className="text-xs font-mono font-bold text-[#18211C]">
                  {formattedCurrentTime}
                </div>
              </div>
              <button
                type="button"
                onClick={() => playSoftChime()}
                className="p-1.5 rounded-lg text-[#66706A] hover:text-[#176B4D] hover:bg-[#EEF6F2] transition-colors"
                title={lang === 'bn' ? 'নরম অ্যালার্ট সাউন্ড টেস্ট করুন' : 'Test Soft Chime'}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Area Quick Switcher Dropdown */}
        {showAreaPicker && (
          <div className="mt-3 pt-3 border-t border-[#E4E9E5] grid grid-cols-2 sm:grid-cols-4 gap-1.5 animate-in fade-in duration-150">
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
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                  currentLocation.area.includes(preset.area)
                    ? 'bg-[#EEF6F2] text-[#176B4D] border-[#C2DFD2] font-semibold'
                    : 'bg-white hover:bg-[#F8FAF9] text-[#66706A] border-[#E4E9E5]'
                }`}
              >
                <div className="truncate">{lang === 'bn' ? preset.nameBn : preset.name}</div>
                <div className="text-[10px] text-[#8D9892] truncate">{preset.area}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. NEXT PRAYER SECTION (Primary Visual Focal Point) */}
      <div className="bg-white border border-[#E4E9E5] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,24,20,0.04)] space-y-4">
        {/* Two-Column Desktop Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Column: Label, Name & Start Time */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-[#176B4D] tracking-wider uppercase">
                {tracking.isRunningNow
                  ? (lang === 'bn' ? 'চলমান ওয়াক্ত' : 'CURRENT PRAYER')
                  : (lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'NEXT PRAYER')}
              </span>
              {tracking.isRunningNow && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF6F2] text-[#176B4D] border border-[#C2DFD2]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D] animate-pulse" />
                  <span>{lang === 'bn' ? 'জামাত চলছে' : 'In Progress'}</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18211C]">
                {lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn}
              </h2>
              <span className="text-sm text-[#66706A]">
                {lang === 'bn' ? 'শুরু: ' : 'Starts at '}
                <strong className="text-[#18211C] font-semibold">{tracking.nextPrayerTimeFormatted}</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Countdown / Remaining Time */}
          <div className="sm:text-right">
            <div className="text-xs text-[#66706A] font-medium mb-0.5">
              {tracking.isRunningNow
                ? (lang === 'bn' ? 'পরবর্তী ওয়াক্ত পর্যন্ত' : 'Until next waqt')
                : (lang === 'bn' ? 'বাকি সময়' : 'Time remaining')}
            </div>
            <div suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-[#176B4D] tracking-tight">
              {mounted ? (
                tracking.diffMinutes > 0
                  ? `${tracking.diffMinutes} ${lang === 'bn' ? 'মিনিট' : 'min remaining'}`
                  : `${tracking.diffSeconds} ${lang === 'bn' ? 'সেকেন্ড' : 'sec remaining'}`
              ) : 'Loading...'}
            </div>
            <div suppressHydrationWarning className="text-xs text-[#66706A] font-mono mt-0.5">
              {mounted ? tracking.countdownText : ''}
            </div>
          </div>
        </div>

        {/* Five Prayer Times in ONE Clean Horizontal Row */}
        <div className="grid grid-cols-5 gap-2 pt-3 border-t border-[#E4E9E5]">
          {[
            { key: 'fajr', bn: 'ফজর', en: 'Fajr', time: activeMosquePrayer.fajr },
            { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr', time: activeMosquePrayer.dhuhr },
            { key: 'asr', bn: 'আসর', en: 'Asr', time: activeMosquePrayer.asr },
            { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: activeMosquePrayer.maghrib },
            { key: 'isha', bn: 'এশা', en: 'Isha', time: activeMosquePrayer.isha }
          ].map((w) => {
            const isTarget = tracking.nextPrayer.key === w.key;
            return (
              <div
                key={w.key}
                className={`py-2 px-1 text-center rounded-xl transition-all border ${
                  isTarget
                    ? 'bg-[#EEF6F2] border-[#C2DFD2] text-[#176B4D]'
                    : 'bg-[#F8FAF9] border-[#E4E9E5] text-[#66706A]'
                }`}
              >
                <div className={`text-xs ${isTarget ? 'font-bold text-[#176B4D]' : 'font-medium text-[#18211C]'}`}>
                  {lang === 'bn' ? w.bn : w.en}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 ${isTarget ? 'font-bold text-[#176B4D]' : 'text-[#66706A]'}`}>
                  {w.time.split(' ')[0]}
                  <span className="text-[9px] ml-0.5 opacity-75">{w.time.split(' ')[1]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hadith / Daily Reflection (Visually Secondary) */}
        <div className="pt-3 border-t border-[#E4E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#66706A]">
          <div className="italic">
            <span>&ldquo;{lang === 'bn' ? wisdom.verseBn : wisdom.verseEn}&rdquo;</span>
          </div>
          <span className="text-[11px] text-[#8D9892] sm:text-right whitespace-nowrap">
            — {lang === 'bn' ? wisdom.sourceBn : wisdom.sourceEn}
          </span>
        </div>
      </div>
    </div>
  );
}
