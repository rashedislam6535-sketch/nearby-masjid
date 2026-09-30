'use client';

import React from 'react';
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle, ChevronRight, Compass } from 'lucide-react';
import { MosqueData } from '@/types/masjid';
import { calculatePrayerCountdown, checkTimetableValidity } from '@/lib/prayerTracker';
import { calculateQiblaBearing } from '@/lib/geoUtils';

interface MosqueCardProps {
  mosque: MosqueData;
  onViewDetails: (mosque: MosqueData) => void;
  lang: 'en' | 'bn';
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

const DEFAULT_FALLBACK_DATES = {
  updated_date: '2026-03-01T00:00:00.000Z',
  next_update_date: '2026-03-16T00:00:00.000Z'
};

export function MosqueCard({ mosque, onViewDetails, lang }: MosqueCardProps) {
  const prayer = mosque.prayer || {
    mosque_id: mosque.id,
    fajr: '05:10 AM',
    dhuhr: '01:15 PM',
    asr: '04:25 PM',
    maghrib: '06:10 PM',
    isha: '08:00 PM',
    jummah: '01:30 PM',
    image: '/images/charts/baitul_aman_chart.svg',
    ...DEFAULT_FALLBACK_DATES
  };

  const tracking = calculatePrayerCountdown(prayer);
  const validity = checkTimetableValidity(prayer.updated_date, prayer.next_update_date);
  const qibla = calculateQiblaBearing(mosque.latitude, mosque.longitude);

  return (
    <div className="bg-white rounded-[14px] border border-[#E4E9E5] shadow-[0_1px_3px_rgba(16,24,20,0.04)] hover:border-[#C2DFD2] hover:shadow-[0_4px_12px_rgba(16,24,20,0.06)] transition-all flex flex-col overflow-hidden group">
      {/* Mosque Cover Image Header */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mosque.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
          alt={mosque.mosque_name_en}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Minimal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Distance Badge (Restrained, clear) */}
        {mosque.distance_text && (
          <div className="absolute top-3 left-3 bg-white/95 text-[#18211C] backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 shadow-xs border border-black/5">
            <MapPin className="w-3 h-3 text-[#176B4D]" />
            <span>{mosque.distance_text}</span>
          </div>
        )}

        {/* Timetable Status Badge (Restrained) */}
        <div className="absolute top-3 right-3">
          {validity.isExpired ? (
            <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs">
              <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
              <span>{lang === 'bn' ? 'আপডেট প্রয়োজন' : 'Update Needed'}</span>
            </span>
          ) : (
            <span className="bg-white/95 text-[#176B4D] border border-black/5 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 shadow-xs">
              <CheckCircle className="w-3 h-3 text-[#176B4D]" />
              <span>{validity.daysRemaining}d valid</span>
            </span>
          )}
        </div>

        {/* Mosque Title & Address Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-base font-semibold leading-snug drop-shadow-xs truncate">
            {lang === 'bn' ? mosque.mosque_name_bn : mosque.mosque_name_en}
          </h3>
          <p className="text-xs text-slate-200 truncate mt-0.5 flex items-center gap-1">
            <span className="truncate">{mosque.address}</span>
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Next Prayer Highlight Box */}
        <div className="bg-[#F8FAF9] rounded-xl p-3 border border-[#E4E9E5] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#66706A]">
              {lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'Next Prayer'}
            </span>
            <div className="text-sm font-semibold text-[#18211C] leading-tight">
              {lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-[#176B4D] font-mono">
              {tracking.nextPrayerTimeFormatted}
            </div>
            <div className="text-[10px] text-[#66706A] font-medium">
              {tracking.countdownText}
            </div>
          </div>
        </div>

        {/* 5 Daily Prayers Strip */}
        <div className="grid grid-cols-5 gap-1 pt-2 border-t border-[#E4E9E5] text-[10px]">
          {[
            { key: 'Fajr', bn: 'ফজর', time: prayer.fajr },
            { key: 'Dhuhr', bn: 'যোহর', time: prayer.dhuhr },
            { key: 'Asr', bn: 'আসর', time: prayer.asr },
            { key: 'Maghrib', bn: 'মাগরিব', time: prayer.maghrib },
            { key: 'Isha', bn: 'এশা', time: prayer.isha },
          ].map((item) => (
            <div key={item.key} className="text-center">
              <span className="text-[#8D9892] block font-medium truncate">{lang === 'bn' ? item.bn : item.key}</span>
              <span className="font-semibold text-[#18211C] font-mono block truncate">{item.time.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* Footer: Qibla & View Details CTA */}
        <div className="pt-2 border-t border-[#E4E9E5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-[#66706A]">
            <Compass className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Qibla {qibla.degrees}° {qibla.compassDirection}</span>
          </div>

          <button
            type="button"
            onClick={() => onViewDetails(mosque)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#176B4D] bg-[#EEF6F2] hover:bg-[#E2EFE8] border border-[#C2DFD2] transition-colors flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'বিস্তারিত' : 'View Details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
