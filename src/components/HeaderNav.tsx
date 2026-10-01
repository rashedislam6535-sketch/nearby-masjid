'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Compass, Map, PlusCircle, Sun, Moon, Sparkles, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface HeaderNavProps {
  activeTab: 'list' | 'map' | 'admin';
  setActiveTab: (tab: 'list' | 'map' | 'admin') => void;
  onOpenQibla?: () => void;
  lang: 'en' | 'bn';
  setLang: (lang: 'en' | 'bn') => void;
  expiredCount?: number;
}

export function HeaderNav({ activeTab, setActiveTab, onOpenQibla, lang, setLang, expiredCount = 0 }: HeaderNavProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close theme menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { id: ThemeMode; labelEn: string; labelBn: string; icon: React.ReactNode; descEn: string; descBn: string }[] = [
    {
      id: 'light',
      labelEn: 'Light',
      labelBn: 'লাইট',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      descEn: 'Warm daylight',
      descBn: 'উজ্জ্বল শুভ্র'
    },
    {
      id: 'dim',
      labelEn: 'Dim',
      labelBn: 'ডিম',
      icon: <Moon className="w-3.5 h-3.5 text-emerald-400" />,
      descEn: 'Midnight forest',
      descBn: 'স্নিগ্ধ রাত'
    },
    {
      id: 'dark',
      labelEn: 'Dark',
      labelBn: 'ডার্ক',
      icon: <span className="text-xs">🌑</span>,
      descEn: 'OLED pitch black',
      descBn: 'গাঢ় অন্ধকার'
    },
  ];

  const currentThemeObj = themeOptions.find(t => t.id === theme) || themeOptions[0];

  return (
    <header 
      className="sticky top-0 z-40 backdrop-blur-md border-b h-16 w-full flex items-center shadow-xs transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 w-full">
        {/* App Logo & Name */}
        <div 
          onClick={() => setActiveTab('list')}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <div 
            className="w-9 h-9 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center shadow-xs transition-colors"
            style={{
              backgroundColor: 'var(--brand-green-surface)',
              borderColor: 'var(--brand-green-border)'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Nearby Masjid Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight font-serif truncate" style={{ color: 'var(--text-primary)' }}>
                Nearby Masjid
              </span>
              <span 
                className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border flex-shrink-0"
                style={{
                  backgroundColor: 'var(--brand-gold-surface)',
                  color: 'var(--brand-gold-text)',
                  borderColor: 'var(--brand-gold-border)'
                }}
              >
                BD
              </span>
            </div>
            <p className="text-xs -mt-0.5 truncate hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'bn' ? 'কাছের মসজিদ ও নামাজের সময়সূচি' : 'Mosque Finder & Prayer Timetable'}
            </p>
          </div>
        </div>

        {/* View Switcher & Secondary Utility Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Main Navigation - Desktop/Tablet */}
          <nav 
            className="hidden sm:flex items-center gap-1 p-1 rounded-xl border"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border-color)'
            }}
          >
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'hover:opacity-85'
              }`}
              style={activeTab !== 'list' ? { color: 'var(--text-secondary)' } : undefined}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মসজিদ' : 'Nearby'}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'hover:opacity-85'
              }`}
              style={activeTab !== 'map' ? { color: 'var(--text-secondary)' } : undefined}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ম্যাপ' : 'Map'}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#0B3B2C] text-white shadow-xs'
                  : 'hover:opacity-85'
              }`}
              style={activeTab !== 'admin' ? { color: 'var(--text-secondary)' } : undefined}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-102 active:scale-98"
              style={{
                backgroundColor: 'var(--brand-gold-surface)',
                color: 'var(--brand-gold-text)',
                borderColor: 'var(--brand-gold-border)'
              }}
              title={lang === 'bn' ? 'কিবলা কম্পাস দেখুন' : 'Open Qibla Compass'}
            >
              <span className="text-sm leading-none">🕋</span>
              <span>{lang === 'bn' ? 'কিবলা' : 'Qibla'}</span>
            </button>
          )}

          {/* 3-Way Theme Switcher (Light / Dim / Dark) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              title={`Current Theme: ${currentThemeObj.labelEn}. Click to choose Light, Dim, or Dark.`}
            >
              <span className="flex items-center justify-center">{currentThemeObj.icon}</span>
              <span className="hidden sm:inline text-xs">{lang === 'bn' ? currentThemeObj.labelBn : currentThemeObj.labelEn}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {showThemeMenu && (
              <div 
                className="absolute right-0 mt-1.5 w-44 rounded-2xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'থিম নির্বাচন করুন' : 'Select Theme'}
                </div>
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSelected 
                          ? 'bg-[#0B3B2C] text-white' 
                          : 'hover:opacity-80'
                      }`}
                      style={!isSelected ? { color: 'var(--text-primary)' } : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center">{opt.icon}</span>
                        <div className="text-left leading-tight">
                          <div className="font-bold">{lang === 'bn' ? opt.labelBn : opt.labelEn}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'opacity-60'}`}>
                            {lang === 'bn' ? opt.descBn : opt.descEn}
                          </div>
                        </div>
                      </div>
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs hover:opacity-80"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="Toggle Language"
          >
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}
