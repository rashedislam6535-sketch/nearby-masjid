'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Bell, Sparkles, ChevronDown } from 'lucide-react';
import { calculatePrayerCountdown } from '@/lib/prayerTracker';
import { BD_LOCATION_PRESETS, BDLocationPreset } from '@/lib/geoUtils';

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
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [mounted, setMounted] = useState<boolean>(false);
  const [showAreaPicker, setShowAreaPicker] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tracking = calculatePrayerCountdown(activeMosquePrayer, currentTime);

  // Format current live time
  const formattedCurrentTime = mounted
    ? currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : '04:00:00 PM';

  return (
    <div className="space-y-3">
      {/* Assalamu Alaikum & Current Location Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-lg border border-emerald-800/60 relative overflow-hidden">
        {/* Subtle Islamic Motif Background Decoration */}
        <div className="absolute right-0 top-0 w-36 h-36 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 mb-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'আসসালামু আলাইকুম' : 'Assalamu Alaikum'}</span>
            </div>
            <h1 className="text-xl font-bold font-serif tracking-tight text-white mt-0.5">
              {lang === 'bn' ? 'কাছের মসজিদ খুঁজুন' : 'Find Nearby Mosques'}
            </h1>
          </div>

          {/* Current Live Digital Clock */}
          <div className="text-right">
            <div className="text-[11px] font-medium text-emerald-300/80 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{lang === 'bn' ? 'বর্তমান সময় (BST)' : 'Current Time (BST)'}</span>
            </div>
            <div suppressHydrationWarning className="text-sm font-mono font-bold text-amber-300">
              {formattedCurrentTime}
            </div>
          </div>
        </div>

        {/* Location Detection Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-800/90 flex items-center justify-center text-amber-400 shadow-inner">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                {lang === 'bn' ? '📍 বর্তমান অবস্থান' : '📍 Current Location'}
              </span>
              <button
                onClick={() => setShowAreaPicker(!showAreaPicker)}
                className="flex items-center gap-1 text-xs font-bold text-white hover:text-amber-300 transition-colors"
              >
                <span>{currentLocation.area}</span>
                <ChevronDown className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>

          {/* GPS refresh / live detection button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRequestGps}
              disabled={gpsLoading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                currentLocation.isGps
                  ? 'bg-emerald-600/60 text-white border-emerald-400/40 shadow-sm'
                  : 'bg-emerald-950 hover:bg-emerald-800 text-emerald-200 border-emerald-700/60'
              }`}
              title="Use precise GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-amber-400' : 'text-emerald-300'}`} />
              <span>{gpsLoading ? (lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Locating...') : (currentLocation.isGps ? 'GPS Live' : 'Use GPS')}</span>
            </button>
          </div>
        </div>

        {/* Area Quick Switcher Dropdown */}
        {showAreaPicker && (
          <div className="mt-3 pt-3 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  currentLocation.area.includes(preset.area)
                    ? 'bg-amber-500 text-emerald-950 font-bold'
                    : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200'
                }`}
              >
                <div className="font-semibold truncate">{lang === 'bn' ? preset.nameBn : preset.name}</div>
                <div className="text-[10px] opacity-75">{preset.area}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Prayer Card (Requested exact format) */}
      <div className={`rounded-2xl p-4 shadow-md transition-all ${
        tracking.isRunningNow
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white border-2 border-amber-400 shadow-amber-500/10'
          : 'bg-white text-slate-800 border border-slate-200/80'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              tracking.isRunningNow
                ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-emerald-950'
                : 'bg-emerald-900 text-amber-300'
            }`}>
              🕌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  tracking.isRunningNow ? 'text-amber-300' : 'text-emerald-700'
                }`}>
                  {tracking.isRunningNow 
                    ? (lang === 'bn' ? 'চলমান ওয়াক্ত' : 'Running Prayer') 
                    : (lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'Next Prayer')}
                </span>
                {tracking.isRunningNow && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <h2 className={`text-2xl font-black font-serif tracking-tight ${
                tracking.isRunningNow ? 'text-white' : 'text-emerald-950'
              }`}>
                {lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn}
              </h2>
            </div>
          </div>

          {/* Time & Alert button */}
          <div className="text-right">
            <div className={`text-xs font-medium ${tracking.isRunningNow ? 'text-emerald-200' : 'text-slate-500'}`}>
              {lang === 'bn' ? 'শুরুর সময়' : 'Starts'}
            </div>
            <div className={`text-2xl font-black tracking-tight ${
              tracking.isRunningNow ? 'text-amber-300' : 'text-emerald-900'
            }`}>
              {tracking.nextPrayerTimeFormatted}
            </div>
          </div>
        </div>

        {/* When Prayer Time Starts Banner (Explicitly requested by user) */}
        {tracking.isRunningNow ? (
          <div className="mt-3.5 bg-amber-500/20 border border-amber-400/50 rounded-xl px-3.5 py-2 flex items-center justify-between text-amber-200 font-bold text-sm animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <span>
                {tracking.activePrayerName} prayer time started ({tracking.currentPrayer?.nameBn} জামাত চলছে)
              </span>
            </div>
            <span className="text-xs bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full font-extrabold uppercase">
              Live
            </span>
          </div>
        ) : (
          <div suppressHydrationWarning className="mt-3.5 bg-emerald-50 rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 text-sm font-medium">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'বাকি সময়:' : 'Remaining:'}</span>
              <strong suppressHydrationWarning className="text-emerald-950 font-bold text-base">
                {mounted ? (tracking.diffMinutes > 0
                  ? `${tracking.diffMinutes} ${lang === 'bn' ? 'মিনিট' : 'minutes'}`
                  : `${tracking.diffSeconds} ${lang === 'bn' ? 'সেকেন্ড' : 'seconds'}`) : 'Calculating...'}
              </strong>
            </div>
            <div suppressHydrationWarning className="text-xs text-emerald-700 font-medium">
              {mounted ? tracking.countdownText : ''}
            </div>
          </div>
        )}

        {/* 5 Daily Waqts Progress Bar */}
        <div className="mt-3 grid grid-cols-5 gap-1 pt-2 border-t border-slate-100/20">
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
                className={`text-center py-1 px-0.5 rounded-lg text-[11px] transition-all ${
                  isTarget
                    ? 'bg-amber-500 text-emerald-950 font-bold shadow-sm ring-1 ring-amber-400'
                    : tracking.isRunningNow
                    ? 'bg-emerald-950/40 text-emerald-200'
                    : 'bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-semibold truncate">{lang === 'bn' ? w.bn : w.en}</div>
                <div className="text-[10px] font-mono opacity-85 truncate">{w.time.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
