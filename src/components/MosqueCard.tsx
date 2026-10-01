'use client';

import React from 'react';
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight, Compass } from 'lucide-react';
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
    <div 
      className="rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all flex flex-col overflow-hidden group hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Mosque Cover Image Header */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mosque.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
          alt={mosque.mosque_name_en}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          loading="lazy"
        />

        {/* Minimal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Distance Badge */}
        {mosque.distance_text && (
          <div className="absolute top-3 left-3 bg-white/95 text-[#0B3B2C] backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#C2DFD2]">
            <MapPin className="w-3.5 h-3.5 text-[#0B3B2C]" />
            <span>{mosque.distance_text}</span>
          </div>
        )}

        {/* Timetable Status Badge */}
        <div className="absolute top-3 right-3">
          {validity.isExpired ? (
            <span className="bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <AlertTriangle className="w-3 h-3 text-[#EA580C]" />
              <span>{lang === 'bn' ? 'আপডেট প্রয়োজন' : 'Update Needed'}</span>
            </span>
          ) : (
            <span className="bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]/60 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <CheckCircle className="w-3 h-3 text-[#854D0E]" />
              <span>{validity.daysRemaining}d valid</span>
            </span>
          )}
        </div>

        {/* Mosque Title & Address Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-base font-bold font-serif leading-snug drop-shadow-sm truncate">
            {lang === 'bn' ? mosque.mosque_name_bn : mosque.mosque_name_en}
          </h3>
          <p className="text-xs text-slate-200 truncate mt-0.5 flex items-center gap-1 drop-shadow-xs">
            <span className="truncate">{mosque.address}</span>
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Next Prayer Highlight Box */}
        <div 
          className="rounded-xl p-3 border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--brand-green-surface)',
            borderColor: 'var(--brand-green-border)'
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--brand-green)' }}>
              {lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'Next Prayer'}
            </span>
            <div className="text-sm font-bold leading-tight font-serif" style={{ color: 'var(--text-primary)' }}>
              {lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-extrabold font-mono" style={{ color: 'var(--brand-green)' }}>
              {tracking.nextPrayerTimeFormatted}
            </div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {tracking.countdownText}
            </div>
          </div>
        </div>

        {/* 5 Daily Prayers Strip */}
        <div className="grid grid-cols-5 gap-1 pt-1.5 border-t text-[10px]" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { key: 'Fajr', bn: 'ফজর', time: prayer.fajr },
            { key: 'Dhuhr', bn: 'যোহর', time: prayer.dhuhr },
            { key: 'Asr', bn: 'আসর', time: prayer.asr },
            { key: 'Maghrib', bn: 'মাগরিব', time: prayer.maghrib },
            { key: 'Isha', bn: 'এশা', time: prayer.isha },
          ].map((item) => (
            <div key={item.key} className="text-center">
              <span className="block font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'bn' ? item.bn : item.key}
              </span>
              <span className="font-bold font-mono block truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {item.time.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Footer: Qibla & View Details CTA */}
        <div className="pt-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <Compass className="w-3.5 h-3.5" style={{ color: 'var(--brand-green)' }} />
            <span>Qibla {qibla.degrees}° {qibla.compassDirection}</span>
          </div>

          <button
            type="button"
            onClick={() => onViewDetails(mosque)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0B3B2C] hover:bg-[#07261C] transition-colors flex items-center gap-1 shadow-2xs"
          >
            <span>{lang === 'bn' ? 'বিস্তারিত' : 'View Details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
