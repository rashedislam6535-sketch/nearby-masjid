'use client';

import React, { useState, useEffect } from 'react';
import { X, Compass, Navigation, MapPin, Sparkles, Share2 } from 'lucide-react';
import { calculateQiblaBearing, calculateDistance } from '@/lib/geoUtils';

interface QiblaCompassModalProps {
  userLocation: {
    lat: number;
    lng: number;
    area: string;
    isGps: boolean;
  };
  onClose: () => void;
  lang: 'en' | 'bn';
}

export function QiblaCompassModal({ userLocation, onClose, lang }: QiblaCompassModalProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);

  const qibla = calculateQiblaBearing(userLocation.lat, userLocation.lng);
  
  // Distance from user to Kaaba (21.4225, 39.8262)
  const distanceToKaaba = calculateDistance(userLocation.lat, userLocation.lng, 21.4225, 39.8262);

  // Device orientation listener (if smartphone sensor is available)
  useEffect(() => {
    function handleOrientation(e: Event) {
      const devEvt = e as DeviceOrientationEvent;
      if (devEvt.alpha !== null && devEvt.alpha !== undefined) {
        setHasCompassSupport(true);
        // alpha: 0 to 360 degrees
        setDeviceHeading(Math.round(devEvt.alpha));
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const compassRotation = deviceHeading !== null ? (qibla.degrees - deviceHeading + 360) % 360 : qibla.degrees;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl border border-emerald-700/60 relative">
        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/60 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-lg leading-tight text-white flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'কিবলা কম্পাস' : 'Qibla Direction Compass'}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-emerald-300">
                {lang === 'bn' ? 'পবিত্র কা\'বা শরীফের সঠিক দিক' : 'Precise direction toward holy Kaaba'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-emerald-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-6 relative z-10">
          {/* Current location chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/70 text-emerald-200 rounded-full text-xs border border-emerald-700/50">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="font-medium truncate max-w-[240px]">{userLocation.area}</span>
          </div>

          {/* Compass Dial Graphic */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            {/* Outer Ring with degree markings */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-700/40 shadow-inner flex items-center justify-center">
              {/* Compass Cardinal Points */}
              <span className="absolute top-2 font-bold text-xs text-rose-400 font-mono">N (০°)</span>
              <span className="absolute right-2 font-bold text-xs text-emerald-300 font-mono">E (৯০°)</span>
              <span className="absolute bottom-2 font-bold text-xs text-emerald-300 font-mono">S (১৮০°)</span>
              <span className="absolute left-2 font-bold text-xs text-amber-400 font-mono">W (২৭০°)</span>
            </div>

            {/* Inner Ring with Subtle Golden Radial Pattern */}
            <div className="w-48 h-48 rounded-full border border-amber-400/30 bg-emerald-900/30 flex items-center justify-center shadow-lg relative">
              
              {/* Rotating Pointer Container */}
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                {/* Kaaba Direction Marker on the ring */}
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-amber-300">
                    🕋
                  </div>
                  <div className="w-0.5 h-16 bg-gradient-to-b from-amber-400 to-transparent mt-1" />
                </div>
              </div>

              {/* Center Pivot Point */}
              <div className="w-14 h-14 rounded-full bg-emerald-950 border-2 border-amber-400 flex flex-col items-center justify-center shadow-md">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  {qibla.compassDirection}
                </span>
                <span className="text-xs font-black text-white font-mono leading-none">
                  {qibla.degrees}°
                </span>
              </div>
            </div>
          </div>

          {/* Compass Readout Metrics */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-emerald-900/50 p-3 rounded-2xl border border-emerald-800/80">
              <span className="text-[11px] text-emerald-300 block font-medium">
                {lang === 'bn' ? 'সঠিক কিবলা কোণ' : 'Target Bearing'}
              </span>
              <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                {qibla.degrees}° {qibla.compassDirection}
              </div>
              <span className="text-[10px] text-emerald-400">
                {lang === 'bn' ? 'পশ্চিম কোণে অবস্থিত' : 'West by North'}
              </span>
            </div>

            <div className="bg-emerald-900/50 p-3 rounded-2xl border border-emerald-800/80">
              <span className="text-[11px] text-emerald-300 block font-medium">
                {lang === 'bn' ? 'কা\'বা শরীফের দূরত্ব' : 'Distance to Kaaba'}
              </span>
              <div className="text-xl font-black text-emerald-100 font-mono mt-0.5">
                {distanceToKaaba.text}
              </div>
              <span className="text-[10px] text-emerald-400">
                {lang === 'bn' ? 'মক্কা মুকাররমা' : 'Makkah, KSA'}
              </span>
            </div>
          </div>

          {/* Device Sensor Guidance note */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left text-xs text-amber-200">
            <p className="leading-relaxed">
              💡 {lang === 'bn' 
                ? 'নামাজে দাঁড়ানোর সময় ফোনটি অনুভূমিক (ফ্ল্যাট) রাখুন এবং তীরচিহ্নিত মক্কার কা\'বা অভিমুখে মুখ করুন।' 
                : 'Hold your device flat and face towards the indicated Kaaba direction for prayer.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-emerald-950/90 border-t border-emerald-800/60 flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(`Qibla Direction from ${userLocation.area}: ${qibla.degrees}° ${qibla.compassDirection} (${distanceToKaaba.text} to Kaaba)`);
                alert(lang === 'bn' ? 'কিবলার তথ্য কপি করা হয়েছে!' : 'Qibla info copied!');
              }
            }}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-700/60"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs shadow-md transition-colors"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
