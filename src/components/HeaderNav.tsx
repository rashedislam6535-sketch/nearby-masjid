'use client';

import React from 'react';
import { Compass, Map, PlusCircle } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E8E4] h-16 w-full flex items-center shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 w-full">
        {/* App Logo & Name */}
        <div 
          onClick={() => setActiveTab('list')}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#C2DFD2] flex-shrink-0 flex items-center justify-center bg-[#F0F7F4] shadow-xs group-hover:border-[#0B3B2C] transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Nearby Masjid Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#18211C] font-serif truncate">
                Nearby Masjid
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]/60 flex-shrink-0">
                BD
              </span>
            </div>
            <p className="text-xs text-[#5F6B64] -mt-0.5 truncate hidden sm:block">
              {lang === 'bn' ? 'কাছের মসজিদ ও নামাজের সময়সূচি' : 'Mosque Finder & Prayer Timetable'}
            </p>
          </div>
        </div>

        {/* View Switcher & Secondary Utility Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Main Navigation - Desktop/Tablet */}
          <nav className="hidden sm:flex items-center gap-1 bg-[#F3F5F3] p-1 rounded-xl border border-[#E2E8E4]">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'text-[#5F6B64] hover:text-[#0B3B2C] hover:bg-white/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মসজিদ' : 'Nearby'}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'text-[#5F6B64] hover:text-[#0B3B2C] hover:bg-white/80'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ম্যাপ' : 'Map'}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'text-[#5F6B64] hover:text-[#0B3B2C] hover:bg-white/80'
              }`}
              title={lang === 'bn' ? 'নতুন মসজিদ যোগ করুন বা সময়সূচি হালনাগাদ করুন' : 'Add mosque or update prayer times'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'যোগ ও আপডেট' : 'Contribute'}</span>
              {expiredCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              )}
            </button>
          </nav>

          {/* Qibla Compass Trigger Button */}
          {onOpenQibla && (
            <button
              onClick={onOpenQibla}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]/70 transition-colors shadow-2xs"
              title={lang === 'bn' ? 'কিবলা কম্পাস দেখুন' : 'Open Qibla Compass'}
            >
              <span className="text-sm leading-none">🕋</span>
              <span>{lang === 'bn' ? 'কিবলা' : 'Qibla'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F3F5F3] text-[#18211C] border border-[#E2E8E4] transition-colors"
            title="Toggle Language"
          >
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}
