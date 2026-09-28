'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Compass, MapPin, Sparkles, Share2, Smartphone, Sliders, CheckCircle2, RotateCw, Volume2 } from 'lucide-react';
import { calculateQiblaBearing, calculateDistance } from '@/lib/geoUtils';
import { playSoftChime } from '@/lib/islamicUtils';

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
  // Live device heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [mode, setMode] = useState<'live' | 'manual'>('live');
  const [manualHeading, setManualHeading] = useState<number>(0);
  const hasVibratedRef = useRef<boolean>(false);

  // Smooth rotation tracking across 360/0 degree wrap
  const lastHeadingRef = useRef<number>(0);

  const qibla = calculateQiblaBearing(userLocation.lat, userLocation.lng);
  const distanceToKaaba = calculateDistance(userLocation.lat, userLocation.lng, 21.4225, 39.8262);

  // Active heading depending on mode
  const currentHeading = mode === 'live' ? deviceHeading : manualHeading;

  // Angular difference between current device heading and Qibla (-180 to +180)
  // Positive means user should turn Right; Negative means user should turn Left
  const rawDiff = ((qibla.degrees - currentHeading + 540) % 360) - 180;
  const isAligned = Math.abs(rawDiff) <= 4;

  // Trigger haptic vibration & sound on alignment
  useEffect(() => {
    if (isAligned && !hasVibratedRef.current) {
      hasVibratedRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {
          // ignore
        }
      }
      playSoftChime();
    } else if (!isAligned) {
      hasVibratedRef.current = false;
    }
  }, [isAligned]);

  // Orientation event handler
  const handleOrientation = useCallback((e: Event) => {
    const devEvt = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
    let heading: number | null = null;

    if (typeof devEvt.webkitCompassHeading !== 'undefined' && devEvt.webkitCompassHeading !== null) {
      // iOS Safari provides direct magnetic compass heading
      heading = devEvt.webkitCompassHeading;
    } else if (devEvt.alpha !== null && devEvt.alpha !== undefined) {
      // Standard Android Chrome: alpha is counter-clockwise around z-axis
      // True heading = (360 - alpha) % 360
      heading = (360 - devEvt.alpha) % 360;
    }

    if (heading !== null) {
      setHasCompassSupport(true);
      const rounded = Math.round(heading);
      setDeviceHeading(rounded);
      lastHeadingRef.current = rounded;
    }
  }, []);

  // Request motion permission (specifically for iOS 13+)
  const requestCompassPermission = async () => {
    setPermissionRequested(true);
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (response === 'granted') {
          setPermissionDenied(false);
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setPermissionDenied(true);
          setMode('manual');
        }
      } catch (err) {
        console.warn('Compass permission error:', err);
        setPermissionDenied(true);
        setMode('manual');
      }
    } else {
      // Non-iOS or older devices: check if orientation events fire
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attach orientation listeners
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function') {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  // Dial rotation: rotate by -heading so North on dial tracks magnetic North
  const dialRotation = -currentHeading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl overflow-hidden w-full max-w-md max-h-[96vh] shadow-2xl border border-emerald-700/60 relative flex flex-col">
        {/* Glow ambient background circles */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isAligned ? 'bg-amber-400/25 scale-125' : 'bg-amber-400/10'
        }`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isAligned ? 'bg-emerald-400/30 scale-125' : 'bg-emerald-500/15'
        }`} />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-emerald-800/60 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-colors ${
              isAligned ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-300' : 'bg-emerald-800 text-amber-300'
            }`}>
              <Compass className={`w-5 h-5 ${isAligned ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="font-bold font-serif text-base sm:text-lg leading-tight text-white flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'স্মার্ট কিবলা কম্পাস' : 'Smart Qibla Compass'}</span>
                {isAligned && <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-300">
                {lang === 'bn' ? 'সরাসরি পবিত্র কা\'বা শরীফের দিকদর্শন' : 'Precise direction toward the Holy Kaaba'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-emerald-700/50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 text-center space-y-3.5 sm:space-y-4 relative z-10 flex-1 overflow-y-auto overscroll-contain">
          {/* Top Bar: Location & Mode Switcher */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/70 text-emerald-200 rounded-full text-xs border border-emerald-700/50 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="font-medium truncate">{userLocation.area}</span>
            </div>

            {/* Mode Toggle (Live vs Manual) */}
            <div className="inline-flex items-center bg-emerald-950/80 p-0.5 rounded-xl border border-emerald-700/60 text-[11px]">
              <button
                onClick={() => setMode('live')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  mode === 'live' ? 'bg-amber-500 text-emerald-950 font-bold shadow' : 'text-emerald-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{lang === 'bn' ? 'লাইভ সেন্সর' : 'Live Sensor'}</span>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  mode === 'manual' ? 'bg-amber-500 text-emerald-950 font-bold shadow' : 'text-emerald-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ম্যানুয়াল' : 'Manual'}</span>
              </button>
            </div>
          </div>

          {/* iOS / Permission Helper if sensor not yet active */}
          {mode === 'live' && !hasCompassSupport && (
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-center sm:text-left">
                {lang === 'bn'
                  ? 'মোবাইল সেন্সর বা ম্যাগনেটোমিটার সক্রিয় করতে অনুমতি বোতাম চাপুন'
                  : 'Tap below to grant mobile sensor access for live rotation'}
              </span>
              <button
                onClick={requestCompassPermission}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs flex-shrink-0 shadow transition-colors"
              >
                {lang === 'bn' ? 'সেন্সর চালু করুন' : 'Enable Sensor'}
              </button>
            </div>
          )}

          {/* Compass Dial Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center my-1 select-none">
            {/* Outer Reference Reticle: Phone's Heading Pointer (Fixed at Top / 12 o'clock) */}
            <div className="absolute top-0 z-30 flex flex-col items-center pointer-events-none">
              <div className={`w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] transition-colors drop-shadow-md ${
                isAligned ? 'border-t-amber-400 scale-125 animate-pulse' : 'border-t-amber-300/80'
              }`} />
              <span className="text-[9px] font-bold text-amber-300 tracking-wider -mt-0.5 bg-emerald-950/90 px-1.5 py-0.2 rounded-full border border-amber-400/40">
                {lang === 'bn' ? 'আপনার সামনে' : 'AHEAD'}
              </span>
            </div>

            {/* Glowing Ring when Aligned */}
            {isAligned && (
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.45)] animate-pulse pointer-events-none" />
            )}

            {/* Outer Fixed Bezel with Degree Markers */}
            <div className="absolute inset-2 rounded-full border-2 border-emerald-800/80 bg-slate-950/80 shadow-2xl flex items-center justify-center overflow-hidden">
              
              {/* Rotating Compass Rose Dial (rotates with -currentHeading) */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                {/* 360 Degree Radial Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div className={`w-0.5 ${deg % 90 === 0 ? 'h-3 bg-amber-400' : 'h-1.5 bg-emerald-600/60'}`} />
                    {deg % 30 === 0 && (
                      <span className="text-[8px] font-mono text-emerald-400/60 mt-0.5">
                        {deg}°
                      </span>
                    )}
                  </div>
                ))}

                {/* Cardinal Points on Rotating Rose */}
                {/* North (0°) */}
                <div className="absolute top-4 flex flex-col items-center pointer-events-none">
                  <span className="font-extrabold text-xs text-rose-400 font-mono drop-shadow">N</span>
                  <span className="text-[8px] text-rose-300 font-mono">০°</span>
                </div>

                {/* East (90°) */}
                <div className="absolute right-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs text-emerald-300 font-mono">E</span>
                  <span className="text-[8px] text-emerald-400 font-mono">৯০°</span>
                </div>

                {/* South (180°) */}
                <div className="absolute bottom-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs text-emerald-300 font-mono">S</span>
                  <span className="text-[8px] text-emerald-400 font-mono">১৮০°</span>
                </div>

                {/* West (270°) */}
                <div className="absolute left-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs text-amber-300 font-mono">W</span>
                  <span className="text-[8px] text-amber-400 font-mono">২৭০°</span>
                </div>

                {/* Qibla Direction Kaaba Marker at exact Qibla Bearing (e.g. 277°) on this rose */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                  style={{ transform: `rotate(${qibla.degrees}deg)` }}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div className={`p-1 rounded-xl shadow-lg border transition-all ${
                      isAligned
                        ? 'bg-amber-400 text-emerald-950 border-amber-200 scale-125 ring-4 ring-amber-400/40'
                        : 'bg-emerald-900 text-amber-300 border-amber-400/60'
                    }`}>
                      <span className="text-base sm:text-lg leading-none">🕋</span>
                    </div>
                    {/* Beam connecting to center */}
                    <div className={`w-0.5 h-16 sm:h-20 bg-gradient-to-b ${
                      isAligned
                        ? 'from-amber-400 via-amber-300 to-transparent'
                        : 'from-amber-400/70 via-emerald-400/30 to-transparent'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Center Hub Display */}
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-xl z-20 transition-all ${
                isAligned
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-emerald-950 border-amber-200 ring-4 ring-amber-400/30'
                  : 'bg-emerald-950/95 text-white border-emerald-600/60'
              }`}>
                {isAligned ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-950 mb-0.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950">
                      {lang === 'bn' ? 'কিবলামুখী' : 'ALIGNED'}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-950">
                      {qibla.degrees}°
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                      {lang === 'bn' ? 'বর্তমান দিক' : 'HEADING'}
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono leading-none mt-0.5">
                      {currentHeading}°
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold mt-0.5">
                      {qibla.compassDirection}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Directional Alignment Guidance Banner */}
          <div className={`p-3 rounded-2xl border text-sm font-semibold transition-all ${
            isAligned
              ? 'bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-amber-400/70 text-amber-200 shadow-md'
              : 'bg-emerald-900/40 border-emerald-800 text-emerald-100'
          }`}>
            {isAligned ? (
              <div className="flex items-center justify-center gap-2 font-bold text-amber-300">
                <span className="text-lg">🕋</span>
                <span>
                  {lang === 'bn'
                    ? 'আলহামদুলিল্লাহ! আপনি সরাসরি কিবলামুখী আছেন।'
                    : 'Alhamdulillah! You are directly facing the Qibla.'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {rawDiff > 0 ? (
                  <>
                    <span className="text-amber-400 text-base">➡️</span>
                    <span>
                      {lang === 'bn'
                        ? `কিবলামুখী হতে আরও ${Math.round(rawDiff)}° ডানে ঘুরুন`
                        : `Turn ${Math.round(rawDiff)}° Right to face Qibla`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 text-base">⬅️</span>
                    <span>
                      {lang === 'bn'
                        ? `কিবলামুখী হতে আরও ${Math.round(Math.abs(rawDiff))}° বামে ঘুরুন`
                        : `Turn ${Math.round(Math.abs(rawDiff))}° Left to face Qibla`}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Manual Heading Slider (Active in Manual Mode or for testing on Desktop) */}
          {mode === 'manual' && (
            <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-800/80 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-medium">
                  {lang === 'bn' ? 'দিক সামঞ্জস্য করুন / টেস্ট করুন:' : 'Adjust / Test Heading:'}
                </span>
                <span className="font-mono font-bold text-amber-300">{manualHeading}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={manualHeading}
                onChange={(e) => setManualHeading(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  onClick={() => setManualHeading(0)}
                  className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 hover:text-white"
                >
                  {lang === 'bn' ? 'উত্তর (০°)' : 'North (0°)'}
                </button>
                <button
                  onClick={() => setManualHeading(qibla.degrees)}
                  className="px-2 py-0.5 rounded bg-amber-500 text-emerald-950 font-bold hover:bg-amber-400"
                >
                  {lang === 'bn' ? `কিবলায় সেট (${qibla.degrees}°)` : `Snap to Qibla (${qibla.degrees}°)`}
                </button>
                <button
                  onClick={() => setManualHeading(270)}
                  className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 hover:text-white"
                >
                  {lang === 'bn' ? 'পশ্চিম (২৭০°)' : 'West (270°)'}
                </button>
              </div>
            </div>
          )}

          {/* Compass Metrics Readout */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-800/70">
              <span className="text-[11px] text-emerald-300 block font-medium">
                {lang === 'bn' ? 'সঠিক কিবলা কোণ' : 'Target Bearing'}
              </span>
              <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                {qibla.degrees}° {qibla.compassDirection}
              </div>
              <span className="text-[10px] text-emerald-400">
                {lang === 'bn' ? 'পশ্চিম-উত্তর-পশ্চিম' : 'West by North'}
              </span>
            </div>

            <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-800/70">
              <span className="text-[11px] text-emerald-300 block font-medium">
                {lang === 'bn' ? 'কা\'বা শরীফের দূরত্ব' : 'Distance to Kaaba'}
              </span>
              <div className="text-lg font-black text-emerald-100 font-mono mt-0.5">
                {distanceToKaaba.text}
              </div>
              <span className="text-[10px] text-emerald-400">
                {lang === 'bn' ? 'মক্কা মুকাররমা' : 'Makkah, KSA'}
              </span>
            </div>
          </div>

          {/* Calibration / Tip Note */}
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-left text-[11px] text-emerald-300/90 leading-relaxed">
            💡 {lang === 'bn'
              ? 'মোবাইলটি অনুভূমিক (ফ্ল্যাট) রাখুন এবং ধাতব বা ইলেকট্রনিক বস্তু থেকে দূরে রাখুন। সঠিকতার জন্য ফোনটি ৮ (Eight) আকারে বাতাসে কয়েকবার ঘোরান।'
              : 'Hold phone flat away from magnetic objects. Move phone in a figure-8 motion if calibration is required.'}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-emerald-950/90 border-t border-emerald-800/60 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(
                  `Qibla Direction from ${userLocation.area}: ${qibla.degrees}° ${qibla.compassDirection} (${distanceToKaaba.text} to Kaaba in Makkah)`
                );
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
