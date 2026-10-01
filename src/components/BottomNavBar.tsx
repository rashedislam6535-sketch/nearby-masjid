'use client';

import React from 'react';
import { Compass, Map, PlusCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface BottomNavBarProps {
  activeTab: 'list' | 'map' | 'admin';
  setActiveTab: (tab: 'list' | 'map' | 'admin') => void;
  onOpenQibla: () => void;
  lang: 'en' | 'bn';
  expiredCount?: number;
}

export function BottomNavBar({ activeTab, setActiveTab, onOpenQibla, lang, expiredCount = 0 }: BottomNavBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-2 py-1.5 shadow-lg safe-area-bottom transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Nearby Mosques */}
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            activeTab === 'list'
              ? 'font-bold'
              : 'hover:opacity-80'
          }`}
          style={{
            color: activeTab === 'list' ? 'var(--brand-green)' : 'var(--text-secondary)'
          }}
        >
          <div 
            className="p-1 rounded-lg transition-colors"
            style={activeTab === 'list' ? { backgroundColor: 'var(--brand-green-surface)' } : undefined}
          >
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'মসজিদ' : 'Nearby'}
          </span>
        </button>

        {/* Tab 2: Interactive Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            activeTab === 'map'
              ? 'font-bold'
              : 'hover:opacity-80'
          }`}
          style={{
            color: activeTab === 'map' ? 'var(--brand-green)' : 'var(--text-secondary)'
          }}
        >
          <div 
            className="p-1 rounded-lg transition-colors"
            style={activeTab === 'map' ? { backgroundColor: 'var(--brand-green-surface)' } : undefined}
          >
            <Map className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'ম্যাপ' : 'Map'}
          </span>
        </button>

        {/* Tab 3: Qibla Compass Action */}
        <button
          onClick={onOpenQibla}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-transform active:scale-95"
          style={{ color: 'var(--brand-gold-text)' }}
        >
          <div 
            className="p-1 rounded-lg border shadow-2xs"
            style={{
              backgroundColor: 'var(--brand-gold-surface)',
              borderColor: 'var(--brand-gold-border)'
            }}
          >
            <span className="text-base leading-none">🕋</span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">
            {lang === 'bn' ? 'কিবলা' : 'Qibla'}
          </span>
        </button>

        {/* Tab 4: Open Contribute Portal (Add & Update) */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            activeTab === 'admin'
              ? 'font-bold'
              : 'hover:opacity-80'
          }`}
          style={{
            color: activeTab === 'admin' ? 'var(--brand-green)' : 'var(--text-secondary)'
          }}
        >
          <div 
            className="p-1 rounded-lg transition-colors"
            style={activeTab === 'admin' ? { backgroundColor: 'var(--brand-green-surface)' } : undefined}
          >
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'যোগ করুন' : 'Contribute'}
          </span>
          {expiredCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-[#DC2626] rounded-full" />
          )}
        </button>

        {/* Tab 5: Theme Quick Toggle (Light / Dim / Dark) */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          title="Toggle Light / Dim / Dark mode"
        >
          <div className="p-1 rounded-lg">
            {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
            {theme === 'dim' && <Moon className="w-5 h-5 text-emerald-400" />}
            {theme === 'dark' && <span className="text-sm">🌑</span>}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight capitalize">
            {theme === 'dim' ? (lang === 'bn' ? 'ডিম' : 'Dim') : theme === 'dark' ? (lang === 'bn' ? 'ডার্ক' : 'Dark') : (lang === 'bn' ? 'লাইট' : 'Light')}
          </span>
        </button>
      </div>
    </nav>
  );
}
