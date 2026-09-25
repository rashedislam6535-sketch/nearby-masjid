'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle, ChevronRight, Phone, Compass } from 'lucide-react';
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
    updated_date: new Date().toISOString(),
    next_update_date: new Date(Date.now() + 15 * 86400000).toISOString()
  };

  const tracking = calculatePrayerCountdown(prayer);
  const validity = checkTimetableValidity(prayer.updated_date, prayer.next_update_date);
  const qibla = calculateQiblaBearing(mosque.latitude, mosque.longitude);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all group flex flex-col">
      {/* Mosque Cover Image Header */}
      <div className="relative h-44 w-full bg-emerald-950 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mosque.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
          alt={mosque.mosque_name_en}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

        {/* Distance Badge (Top Left - exactly matching prompt format e.g. Distance: 300 meter) */}
        {mosque.distance_text && (
          <div className="absolute top-3 left-3 bg-emerald-900/90 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md border border-amber-400/30">
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>
              {lang === 'bn' ? 'দূরত্ব: ' : 'Distance: '}
              {mosque.distance_text}
            </span>
          </div>
        )}

        {/* Timetable Validity Badge (Top Right) */}
        <div className="absolute top-3 right-3">
          {validity.isExpired ? (
            <span className="bg-rose-500/95 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-md animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>{lang === 'bn' ? 'হালনাগাদ প্রয়োজন' : 'Update Needed'}</span>
            </span>
          ) : (
            <span className="bg-emerald-950/80 text-emerald-200 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>{validity.daysRemaining}d valid</span>
            </span>
          )}
        </div>

        {/* Mosque Name on Cover */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold font-serif leading-tight drop-shadow-sm truncate">
            {lang === 'bn' ? mosque.mosque_name_bn : mosque.mosque_name_en}
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-200 mt-0.5 truncate drop-shadow-sm">
            <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="truncate">{mosque.address}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Next Prayer Highlight Card (Prompt requirement: Next Prayer: Asr 04:25 PM) */}
        <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-sm shadow-sm">
              🕌
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'Next Prayer'}
              </span>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {lang === 'bn' ? tracking.nextPrayer.nameBn : tracking.nextPrayer.nameEn}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-black text-emerald-900 font-mono">
              {tracking.nextPrayerTimeFormatted}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              <span>{tracking.countdownText}</span>
            </div>
          </div>
        </div>

        {/* Validity warning banner if 15-day cycle expired */}
        {validity.isExpired && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-800 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>{validity.message}</span>
          </div>
        )}

        {/* 5 Daily Prayers Mini Strip */}
        <div className="grid grid-cols-5 gap-1 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/80 text-[10px]">
          {[
            { key: 'Fajr', bn: 'ফজর', time: prayer.fajr },
            { key: 'Dhuhr', bn: 'যোহর', time: prayer.dhuhr },
            { key: 'Asr', bn: 'আসর', time: prayer.asr },
            { key: 'Maghrib', bn: 'মাগরিব', time: prayer.maghrib },
            { key: 'Isha', bn: 'এশা', time: prayer.isha },
          ].map((item) => (
            <div key={item.key} className="text-center">
              <span className="text-slate-500 block font-medium truncate">{lang === 'bn' ? item.bn : item.key}</span>
              <span className="font-bold text-emerald-950 font-mono block truncate">{item.time.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* Qibla Direction Information Chip */}
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-700">
          <div className="flex items-center gap-1.5 font-medium text-emerald-950">
            <Compass className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>{lang === 'bn' ? 'কিবলা দিক:' : 'Qibla:'}</span>
            <span className="font-bold text-slate-900 font-mono">
              {qibla.degrees}° {qibla.compassDirection}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {lang === 'bn' ? 'মক্কার কা\'বা অভিমুখে' : 'Toward Makkah'}
          </span>
        </div>

        {/* Action Buttons: View Details & Google Maps */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(mosque)}
            className="flex-1 py-2.5 px-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm group-hover:bg-emerald-850"
          >
            <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Open in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'দিকনির্দেশ' : 'Directions'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
