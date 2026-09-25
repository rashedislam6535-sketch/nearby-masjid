'use client';

import React from 'react';
import { Compass, Map, PlusCircle, Landmark } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'list' | 'map' | 'admin';
  setActiveTab: (tab: 'list' | 'map' | 'admin') => void;
  onOpenQibla?: () => void;
  lang: 'en' | 'bn';
  setLang: (lang: 'en' | 'bn') => void;
  expiredCount?: number;
}

export function HeaderNav({ activeTab, setActiveTab, onOpenQibla, lang, setLang, expiredCount = 0 }: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800/50 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* App Logo & Name */}
        <div 
          onClick={() => setActiveTab('list')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-amber-500/20 flex items-center justify-center border border-amber-400/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Nearby Masjid Logo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white font-serif">
                Nearby Masjid
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                BD
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 -mt-0.5">
              {lang === 'bn' ? 'কাছের মসজিদ ও নামাজের সময়সূচি' : 'Mosque Finder & Prayer Timetable'}
            </p>
          </div>
        </div>

        {/* View Switcher & Language Toggle */}
        <div className="flex items-center gap-2">
          {/* Navigation Pill */}
          <nav className="flex items-center bg-emerald-900/80 rounded-xl p-1 border border-emerald-700/50">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-amber-500 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মসজিদ' : 'Nearby'}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ম্যাপ' : 'Map'}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
              title={lang === 'bn' ? 'নতুন মসজিদ যোগ করুন বা সময়সূচি হালনাগাদ করুন' : 'Add mosque or update prayer times'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'যোগ ও আপডেট' : 'Contribute'}</span>
              {expiredCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {expiredCount}
                </span>
              )}
            </button>
          </nav>

          {/* Qibla Compass Trigger Button */}
          {onOpenQibla && (
            <button
              onClick={onOpenQibla}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all active:scale-95 shadow-sm"
              title={lang === 'bn' ? 'কিবলা কম্পাস দেখুন' : 'Open Qibla Compass'}
            >
              <span>🕋</span>
              <span className="hidden sm:inline font-bold">{lang === 'bn' ? 'কিবলা' : 'Qibla'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-700/60 transition-colors"
            title="Toggle Language"
          >
            {lang === 'en' ? 'বাংলা' : 'ENG'}
          </button>
        </div>
      </div>
    </header>
  );
}
