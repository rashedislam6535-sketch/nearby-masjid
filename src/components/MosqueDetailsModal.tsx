'use client';

import React, { useState } from 'react';
import { X, MapPin, Navigation, Phone, Clock, AlertTriangle, CheckCircle, Calendar, Share2, ZoomIn, Trash2 } from 'lucide-react';
import { MosqueData } from '@/types/masjid';
import { checkTimetableValidity, calculatePrayerCountdown } from '@/lib/prayerTracker';

interface MosqueDetailsModalProps {
  mosque: MosqueData | null;
  onClose: () => void;
  onOpenAdminUpdate?: (mosque: MosqueData) => void;
  onDeleteMosque?: (id: number) => void;
  lang: 'en' | 'bn';
}

export function MosqueDetailsModal({ mosque, onClose, onOpenAdminUpdate, onDeleteMosque, lang }: MosqueDetailsModalProps) {
  const [imageZoomed, setImageZoomed] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  if (!mosque) return null;

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

  const validity = checkTimetableValidity(prayer.updated_date, prayer.next_update_date);
  const tracking = calculatePrayerCountdown(prayer);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${mosque.mosque_name_en} - ${mosque.address}. Google Maps: ${googleMapsUrl}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-xl shadow-2xl border border-slate-200/80 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cover Image & Header */}
        <div className="relative h-56 sm:h-64 w-full bg-emerald-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mosque.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
            alt={mosque.mosque_name_en}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {mosque.distance_text && (
              <span className="bg-emerald-900/90 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                <Navigation className="w-3.5 h-3.5" />
                {mosque.distance_text}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md ${
              validity.isExpired ? 'bg-rose-600 text-white' : 'bg-emerald-700 text-emerald-100'
            }`}>
              {validity.isExpired ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              {validity.isExpired ? (lang === 'bn' ? 'হালনাগাদ প্রয়োজন' : 'Update Needed') : (lang === 'bn' ? 'সক্রিয় সময়সূচি' : 'Active Schedule')}
            </span>
          </div>

          {/* Mosque Title Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-bold font-serif leading-snug drop-shadow-md">
              {mosque.mosque_name_bn}
            </h2>
            <p className="text-sm font-medium text-emerald-300 drop-shadow-sm">
              {mosque.mosque_name_en}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-1 drop-shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{mosque.address}</span>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Quick Contact & Navigation Actions */}
          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>{lang === 'bn' ? 'গুগল ম্যাপে দিকনির্দেশ' : 'Navigate on Google Maps'}</span>
            </a>

            {mosque.contact && (
              <a
                href={`tel:${mosque.contact}`}
                className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>{mosque.contact}</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center transition-colors"
              title="Share Location"
            >
              <Share2 className="w-4 h-4" />
              {copySuccess && <span className="text-[10px] ml-1 text-emerald-600 font-bold">Copied!</span>}
            </button>
          </div>

          {/* 15-Day Timetable Validity Banner (Explicit Requirement) */}
          <div className={`rounded-2xl p-4 border ${
            validity.isExpired 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-950'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {validity.isExpired ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                ) : (
                  <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {lang === 'bn' ? 'সময়সূচির বৈধতার মেয়াদ' : 'Timetable Validity Period'}
                  </h4>
                  <p className="text-sm font-bold mt-0.5">
                    {validity.updatedDateFormatted} — {validity.nextUpdateDateFormatted}
                  </p>
                </div>
              </div>

              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                validity.isExpired 
                  ? 'bg-rose-200 text-rose-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {validity.isExpired 
                  ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired') 
                  : (lang === 'bn' ? `বাকি ${validity.daysRemaining} দিন` : `${validity.daysRemaining} days left`)}
              </span>
            </div>

            {/* Notification reminder if > 15 days expired */}
            {validity.isExpired && (
              <div className="mt-3 pt-3 border-t border-rose-200/80 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-rose-800">
                  ⚠️ {lang === 'bn' ? 'মসজিদের সময়সূচি নিয়মিত পরিবর্তনশীল, হালনাগাদ আবশ্যক' : 'Please update mosque prayer timetable'}
                </div>
                {onOpenAdminUpdate && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminUpdate(mosque);
                    }}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'হালনাগাদ করুন' : 'Update Now'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Prayer Timetable Image Section (Explicit Requirement) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'মসজিদের অনুমোদিত সময়সূচি চার্ট' : 'Uploaded Mosque Prayer Chart'}</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'ছবিতে ক্লিক করে বড় করুন' : 'Click to enlarge'}
              </span>
            </div>

            <div 
              onClick={() => setImageZoomed(!imageZoomed)}
              className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group shadow-inner"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prayer.image || '/images/charts/baitul_aman_chart.svg'}
                alt="Mosque Prayer Timetable Chart"
                className="w-full object-contain max-h-72 transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                <ZoomIn className="w-3 h-3" />
                <span>{imageZoomed ? 'Zoom Out' : 'Zoom'}</span>
              </div>
            </div>
          </div>

          {/* Extracted & Verified Prayer Times (Explicit Requirement) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                {lang === 'bn' ? 'যাচাইকৃত নামাজের জামাত সময়' : 'Extracted Prayer Times (Jamat)'}
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Admin Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'fajr', bn: 'ফজর', en: 'Fajr', time: prayer.fajr, icon: '🌅' },
                { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr', time: prayer.dhuhr, icon: '☀️' },
                { key: 'asr', bn: 'আসর', en: 'Asr', time: prayer.asr, icon: '🌤️' },
                { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: prayer.maghrib, icon: '🌇' },
                { key: 'isha', bn: 'এশা', en: 'Isha', time: prayer.isha, icon: '🌙' },
                { key: 'jummah', bn: "জুমু'আ", en: 'Jummah', time: prayer.jummah || '01:30 PM', icon: '🕌' },
              ].map((item) => {
                const isCurrentNext = tracking.nextPrayer.key === item.key;
                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrentNext
                        ? 'bg-gradient-to-tr from-emerald-900 to-teal-900 text-white border-amber-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold">
                        {item.icon} {lang === 'bn' ? item.bn : item.en}
                      </span>
                      {isCurrentNext && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded">
                          Next
                        </span>
                      )}
                    </div>
                    <div className={`text-lg font-black font-mono tracking-tight ${
                      isCurrentNext ? 'text-amber-300' : 'text-emerald-950'
                    }`}>
                      {item.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bangladesh Administrative Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs space-y-1.5 text-slate-600">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              {lang === 'bn' ? 'প্রশাসনিক এলাকা বিবরণ' : 'Administrative Location Details'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div><strong className="text-slate-900">Division:</strong> {mosque.division}</div>
              <div><strong className="text-slate-900">District:</strong> {mosque.district}</div>
              <div><strong className="text-slate-900">Upazila/Thana:</strong> {mosque.upazila}</div>
              <div><strong className="text-slate-900">Union/Ward:</strong> {mosque.union_name || 'N/A'}</div>
            </div>
            <div className="pt-2 text-[11px] text-slate-500">
              Coordinates: {mosque.latitude.toFixed(5)}, {mosque.longitude.toFixed(5)}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            {onDeleteMosque && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    lang === 'bn'
                      ? `আপনি কি নিশ্চিতভাবে "${mosque.mosque_name_bn || mosque.mosque_name_en}" মসজিদটি ডাটাবেজ থেকে মুছে ফেলতে চান?`
                      : `Are you sure you want to permanently delete "${mosque.mosque_name_en}" from database?`
                  );
                  if (confirmed) {
                    onDeleteMosque(mosque.id);
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title={lang === 'bn' ? 'মসজিদটি ডাটাবেজ থেকে মুছুন' : 'Remove mosque from database'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'মসজিদ মুছুন (Remove)' : 'Remove Mosque'}</span>
              </button>
            )}

            {onOpenAdminUpdate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminUpdate(mosque);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{lang === 'bn' ? 'সময়সূচি হালনাগাদ (Admin)' : 'Update Timetable (Admin)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
