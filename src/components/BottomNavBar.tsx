'use client';

import React from 'react';
import { Compass, Map, PlusCircle, Navigation, Landmark } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'list' | 'map' | 'admin';
  setActiveTab: (tab: 'list' | 'map' | 'admin') => void;
  onOpenQibla: () => void;
  lang: 'en' | 'bn';
  expiredCount?: number;
}

export function BottomNavBar({ activeTab, setActiveTab, onOpenQibla, lang, expiredCount = 0 }: BottomNavBarProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav px-3 py-2 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Nearby Mosques */}
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'list'
              ? 'text-amber-300 font-bold scale-105'
              : 'text-emerald-300/80 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${
            activeTab === 'list' ? 'bg-amber-400/20 ring-1 ring-amber-400/40' : ''
          }`}>
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'মসজিদ' : 'Nearby'}
          </span>
        </button>

        {/* Tab 2: Interactive Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'map'
              ? 'text-amber-300 font-bold scale-105'
              : 'text-emerald-300/80 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${
            activeTab === 'map' ? 'bg-amber-400/20 ring-1 ring-amber-400/40' : ''
          }`}>
            <Map className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'ম্যাপ' : 'Live Map'}
          </span>
        </button>

        {/* Tab 3: Qibla Compass Action */}
        <button
          onClick={onOpenQibla}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-emerald-300/80 hover:text-amber-300 transition-all active:scale-95"
        >
          <div className="p-1 rounded-xl bg-emerald-900/60 ring-1 ring-emerald-700/50">
            <span className="text-base leading-none">🕋</span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'bn' ? 'কিবলা' : 'Qibla'}
          </span>
        </button>

        {/* Tab 4: Open Contribute Portal (Add & Update) */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'admin'
              ? 'text-amber-300 font-bold scale-105'
              : 'text-emerald-300/80 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${
            activeTab === 'admin' ? 'bg-amber-400/20 ring-1 ring-amber-400/40' : ''
          }`}>
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'যোগ করুন' : 'Contribute'}
          </span>
          {expiredCount > 0 && (
            <span className="absolute 0 top-0.5 right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold animate-pulse">
              {expiredCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
