'use client';

import React from 'react';
import { Compass, Map, PlusCircle } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'list' | 'map' | 'admin';
  setActiveTab: (tab: 'list' | 'map' | 'admin') => void;
  onOpenQibla: () => void;
  lang: 'en' | 'bn';
  expiredCount?: number;
}

export function BottomNavBar({ activeTab, setActiveTab, onOpenQibla, lang, expiredCount = 0 }: BottomNavBarProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E4E9E5] px-3 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Nearby Mosques */}
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'list'
              ? 'text-[#0B3B2C] font-bold'
              : 'text-[#5F6B64] hover:text-[#18211C]'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${
            activeTab === 'list' ? 'bg-[#F0F7F4]' : ''
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
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'map'
              ? 'text-[#0B3B2C] font-bold'
              : 'text-[#5F6B64] hover:text-[#18211C]'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${
            activeTab === 'map' ? 'bg-[#F0F7F4]' : ''
          }`}>
            <Map className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'ম্যাপ' : 'Map'}
          </span>
        </button>

        {/* Tab 3: Qibla Compass Action */}
        <button
          onClick={onOpenQibla}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[#66706A] hover:text-[#176B4D] transition-colors"
        >
          <div className="p-1 rounded-lg">
            <span className="text-lg leading-none">🧭</span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'bn' ? 'কিবলা' : 'Qibla'}
          </span>
        </button>

        {/* Tab 4: Open Contribute Portal (Add & Update) */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'admin'
              ? 'text-[#176B4D] font-semibold'
              : 'text-[#66706A] hover:text-[#18211C]'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${
            activeTab === 'admin' ? 'bg-[#EEF6F2]' : ''
          }`}>
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'যোগ করুন' : 'Contribute'}
          </span>
          {expiredCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-[#DC2626] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
}
