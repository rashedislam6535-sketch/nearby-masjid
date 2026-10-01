'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Compass, 
  MapPin, 
  Sparkles, 
  Share2, 
  Smartphone, 
  Sliders, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  RotateCw,
  RotateCcw,
  Navigation2,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
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
  // Device heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [mode, setMode] = useState<'live' | 'manual'>('manual');
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const hasVibratedRef = useRef<boolean>(false);

  const qibla = calculateQiblaBearing(userLocation.lat, userLocation.lng);
  const distanceToKaaba = calculateDistance(userLocation.lat, userLocation.lng, 21.4225, 39.8262);

  // Active heading depending on mode
  const currentHeading = mode === 'live' ? deviceHeading : manualHeading;

  // Angular difference between current heading and Qibla (-180 to +180)
  // Positive: user should turn Right; Negative: user should turn Left
  const rawDiff = ((qibla.degrees - currentHeading + 540) % 360) - 180;
  const isAligned = Math.abs(rawDiff) <= 3;

  // Detect mobile vs desktop on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);
    
    // On mobile devices, default to live mode; on desktop default to manual interactive mode
    if (isMobile) {
      setMode('live');
    } else {
      setMode('manual');
    }
  }, []);

  // Alignment chime & vibration
  useEffect(() => {
    if (isAligned && !hasVibratedRef.current) {
      hasVibratedRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {}
      }
      if (soundEnabled) {
        playSoftChime();
      }
    } else if (!isAligned) {
      hasVibratedRef.current = false;
    }
  }, [isAligned, soundEnabled]);

  // Orientation event handler
  const handleOrientation = useCallback((e: Event) => {
    const devEvt = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
    let heading: number | null = null;

    if (typeof devEvt.webkitCompassHeading !== 'undefined' && devEvt.webkitCompassHeading !== null) {
      // iOS Safari provides direct magnetic compass heading
      heading = devEvt.webkitCompassHeading;
    } else if (devEvt.alpha !== null && devEvt.alpha !== undefined) {
      // Android Chrome: alpha is counter-clockwise around z-axis
      heading = (360 - devEvt.alpha) % 360;
    }

    if (heading !== null && !isNaN(heading)) {
      setHasCompassSupport(true);
      const rounded = Math.round(heading);
      setDeviceHeading(rounded);
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
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function') {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  // Pointer drag calculation for mouse & touch rotating
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    if (mode === 'live') {
      setMode('manual');
    }
    updateHeadingFromPointer(e.clientX, e.clientY);
  };

  const updateHeadingFromPointer = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle in degrees where 12 o'clock (ahead) is 0°, 3 o'clock is 90°, etc.
    let angleDeg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    if (angleDeg < 0) angleDeg += 360;
    angleDeg = angleDeg % 360;

    // When dragging the dial, user is rotating their heading
    setManualHeading(angleDeg);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      updateHeadingFromPointer(e.clientX, e.clientY);
    };

    const handleGlobalPointerUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging]);

  const snapTo = (deg: number) => {
    setMode('manual');
    setManualHeading((deg + 360) % 360);
  };

  const nudge = (delta: number) => {
    setMode('manual');
    setManualHeading((prev) => (prev + delta + 360) % 360);
  };

  const handleCopyShare = () => {
    const text = `Qibla Direction from ${userLocation.area}: ${qibla.degrees}° ${qibla.compassDirection} (${distanceToKaaba.text} to Holy Kaaba in Makkah). Nearby Masjid App BD.`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Dial rotation: rotate by -currentHeading so North points to 0°
  const dialRotation = -currentHeading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="w-full max-w-md max-h-[96vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative transition-all duration-300"
        style={{
          backgroundColor: 'var(--surface-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div 
          className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isAligned ? 'opacity-30 scale-125' : 'opacity-10'
          }`}
          style={{ backgroundColor: 'var(--brand-gold)' }}
        />
        <div 
          className={`absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isAligned ? 'opacity-35 scale-125' : 'opacity-10'
          }`}
          style={{ backgroundColor: 'var(--brand-green)' }}
        />

        {/* Modal Header */}
        <div 
          className="p-4 flex items-center justify-between border-b relative z-10 flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shadow-xs transition-all ${
                isAligned ? 'scale-105 ring-2 ring-amber-400' : ''
              }`}
              style={{
                backgroundColor: isAligned ? 'var(--brand-gold)' : 'var(--brand-green-surface)',
                color: isAligned ? '#18211C' : 'var(--brand-green)',
                border: '1px solid var(--brand-green-border)'
              }}
            >
              <Compass className={`w-5 h-5 ${isAligned ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold font-serif text-base sm:text-lg leading-tight flex items-center gap-1.5">
                  <span>{lang === 'bn' ? 'স্মার্ট কিবলা কম্পাস' : 'Smart Qibla Compass'}</span>
                </h3>
                {isAligned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950 flex items-center gap-1 shadow-2xs animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'সঠিক' : 'Aligned'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs -mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'bn' ? 'পবিত্র কাবা শরীফের সঠিক দিক ও দূরত্ব' : 'Precise direction toward the Holy Kaaba'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors border text-xs"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)',
                color: soundEnabled ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
              title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors border hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 text-center space-y-3.5 relative z-10 flex-1 overflow-y-auto overscroll-contain">
          
          {/* Top Bar: Location Badge & Live/Interactive Mode Toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border truncate max-w-[210px]"
              style={{
                backgroundColor: 'var(--brand-green-surface)',
                color: 'var(--brand-green)',
                borderColor: 'var(--brand-green-border)'
              }}
            >
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{userLocation.area}</span>
            </div>

            {/* Mode Switcher */}
            <div 
              className="inline-flex items-center p-0.5 rounded-xl border text-[11px]"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)'
              }}
            >
              <button
                onClick={() => setMode('manual')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  mode === 'manual'
                    ? 'bg-[#0B3B2C] text-white shadow-xs'
                    : 'hover:opacity-75'
                }`}
                style={mode !== 'manual' ? { color: 'var(--text-secondary)' } : undefined}
              >
                <Sliders className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ইন্টারেক্টিভ' : 'Interactive'}</span>
              </button>
              
              <button
                onClick={() => {
                  setMode('live');
                  if (!hasCompassSupport && isMobileDevice) {
                    requestCompassPermission();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  mode === 'live'
                    ? 'bg-[#0B3B2C] text-white shadow-xs'
                    : 'hover:opacity-75'
                }`}
                style={mode !== 'live' ? { color: 'var(--text-secondary)' } : undefined}
              >
                <Smartphone className="w-3 h-3" />
                <span>{lang === 'bn' ? 'লাইভ সেন্সর' : 'Live Sensor'}</span>
              </button>
            </div>
          </div>

          {/* Desktop Friendly Notice / Sensor Helper */}
          {!isMobileDevice && (
            <div 
              className="p-2.5 rounded-xl border text-[11px] flex items-center gap-2 text-left"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <span className="text-base flex-shrink-0">🖥️</span>
              <p className="leading-snug">
                {lang === 'bn'
                  ? 'ডেস্কটপ মোড: কম্পাসটি মাউস দিয়ে টেনে বা নিচের বোতাম দিয়ে যেকোনো কোণে ঘোরান। মোবাইল ফোনে এটি স্বয়ংক্রিয়ভাবে ঘোরে।'
                  : 'Desktop Interactive Mode: Click & drag dial or use presets below. On mobile phones, it rotates live via phone sensors.'}
              </p>
            </div>
          )}

          {/* Mobile Sensor Permission Helper if on mobile and no sensor yet */}
          {isMobileDevice && mode === 'live' && !hasCompassSupport && (
            <div 
              className="p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 text-left"
              style={{
                backgroundColor: 'var(--brand-gold-surface)',
                borderColor: 'var(--brand-gold-border)',
                color: 'var(--brand-gold-text)'
              }}
            >
              <span className="text-[11px] leading-tight">
                {lang === 'bn'
                  ? 'মোবাইল সেন্সর বা ম্যাগনেটোমিটার সক্রিয় করতে অনুমতি দিন'
                  : 'Tap to grant compass sensor permission for live orientation'}
              </span>
              <button
                onClick={requestCompassPermission}
                className="px-3 py-1 bg-[#0B3B2C] text-white font-bold rounded-lg text-xs flex-shrink-0 shadow-xs"
              >
                {lang === 'bn' ? 'অনুমতি দিন' : 'Enable'}
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* THE COMPASS ROSE DIAL CONTAINER (DRAGGABLE) */}
          {/* ========================================================= */}
          <div 
            ref={dialRef}
            onPointerDown={handlePointerDown}
            className={`relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center my-1 select-none touch-none rounded-full transition-transform ${
              isDragging ? 'cursor-grabbing scale-102' : 'cursor-grab'
            }`}
            title="Click and drag anywhere to rotate compass heading"
          >
            {/* Outer Reference Reticle: Phone/Screen Forward Heading Pointer (12 o'clock) */}
            <div className="absolute top-0 z-30 flex flex-col items-center pointer-events-none">
              <div 
                className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] transition-transform drop-shadow-md ${
                  isAligned ? 'border-t-amber-500 scale-125 animate-pulse' : 'border-t-emerald-700'
                }`}
              />
              <span 
                className="text-[9px] font-bold tracking-wider -mt-1 px-2 py-0.2 rounded-full border shadow-2xs"
                style={{
                  backgroundColor: isAligned ? '#FEF9C3' : 'var(--surface-card)',
                  color: isAligned ? '#854D0E' : 'var(--text-primary)',
                  borderColor: isAligned ? '#FDE047' : 'var(--border-color)',
                }}
              >
                {lang === 'bn' ? 'সামনে' : 'AHEAD'}
              </span>
            </div>

            {/* Glowing Ring when Aligned */}
            {isAligned && (
              <div 
                className="absolute inset-0 rounded-full border-4 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)] animate-pulse pointer-events-none" 
              />
            )}

            {/* Outer Fixed Bezel with High-Contrast Border */}
            <div 
              className="absolute inset-2 rounded-full border-2 shadow-inner flex items-center justify-center overflow-hidden transition-colors"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: isAligned ? 'var(--brand-gold)' : 'var(--border-color)',
              }}
            >
              {/* Rotating Compass Rose Dial */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center transition-transform duration-150 ease-out"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                {/* 360 Degree Radial Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div 
                      className={`w-0.5 ${
                        deg % 90 === 0 
                          ? 'h-3.5 bg-amber-500' 
                          : deg % 30 === 0 
                            ? 'h-2.5 bg-emerald-600' 
                            : 'h-1.5 opacity-40 bg-slate-500'
                      }`} 
                    />
                    {deg % 30 === 0 && (
                      <span 
                        className="text-[8px] font-mono mt-0.5 font-bold"
                        style={{ color: deg === 0 ? '#E11D48' : 'var(--text-muted)' }}
                      >
                        {deg}°
                      </span>
                    )}
                  </div>
                ))}

                {/* Cardinal Points on the Rose */}
                {/* North (0°) */}
                <div className="absolute top-4 flex flex-col items-center pointer-events-none">
                  <span className="font-extrabold text-xs text-rose-500 font-mono drop-shadow-xs">N</span>
                  <span className="text-[8px] text-rose-500/80 font-mono">০°</span>
                </div>

                {/* East (90°) */}
                <div className="absolute right-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs font-mono" style={{ color: 'var(--text-primary)' }}>E</span>
                  <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>৯০°</span>
                </div>

                {/* South (180°) */}
                <div className="absolute bottom-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs font-mono" style={{ color: 'var(--text-primary)' }}>S</span>
                  <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>১৮০°</span>
                </div>

                {/* West (270°) */}
                <div className="absolute left-4 flex flex-col items-center pointer-events-none">
                  <span className="font-bold text-xs font-mono" style={{ color: 'var(--brand-gold-text)' }}>W</span>
                  <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>২৭০°</span>
                </div>

                {/* Qibla Direction Kaaba Marker at exact calculated bearing */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
                  style={{ transform: `rotate(${qibla.degrees}deg)` }}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div 
                      className={`p-1.5 rounded-xl shadow-md border transition-all ${
                        isAligned
                          ? 'bg-amber-400 text-emerald-950 border-amber-300 scale-125 ring-4 ring-amber-400/40 animate-pulse'
                          : 'bg-[#0B3B2C] text-[#F3BA47] border-[#C2DFD2]'
                      }`}
                    >
                      <span className="text-base leading-none">🕋</span>
                    </div>
                    {/* Beam connecting Kaaba marker to center hub */}
                    <div 
                      className={`w-0.5 h-16 sm:h-20 ${
                        isAligned
                          ? 'bg-gradient-to-b from-amber-400 via-amber-300 to-transparent'
                          : 'bg-gradient-to-b from-emerald-600 via-emerald-500/40 to-transparent'
                      }`} 
                    />
                  </div>
                </div>
              </div>

              {/* Center Hub Display */}
              <div 
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-md z-20 transition-all ${
                  isAligned
                    ? 'bg-amber-400 text-emerald-950 border-amber-300 ring-4 ring-amber-400/30'
                    : ''
                }`}
                style={!isAligned ? {
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                } : undefined}
              >
                {isAligned ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-950 mb-0.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-950">
                      {lang === 'bn' ? 'কিবলামুখী' : 'ALIGNED'}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-950">
                      {qibla.degrees}°
                    </span>
                  </>
                ) : (
                  <>
                    <span 
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {lang === 'bn' ? 'দিক' : 'HEADING'}
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono leading-none mt-0.5">
                      {currentHeading}°
                    </span>
                    <span 
                      className="text-[10px] font-bold mt-0.5"
                      style={{ color: 'var(--brand-green)' }}
                    >
                      {qibla.compassDirection}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Visual Drag Hint */}
          <div className="text-[11px] font-medium flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <span>👆</span>
            <span>{lang === 'bn' ? 'কম্পাস চক্রটি ঘুরিয়ে দিক পরিবর্তন করুন' : 'Drag or click dial to rotate heading'}</span>
          </div>

          {/* Directional Alignment Guidance Banner */}
          <div 
            className={`p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
              isAligned
                ? 'bg-[#FEF9C3] border-[#FDE047] text-[#854D0E] shadow-xs'
                : 'border'
            }`}
            style={!isAligned ? {
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            } : undefined}
          >
            {isAligned ? (
              <div className="flex items-center justify-center gap-2 font-bold text-amber-900">
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
                    <span className="text-base text-amber-600">➡️</span>
                    <span>
                      {lang === 'bn'
                        ? `কিবলামুখী হতে আরও ${Math.round(rawDiff)}° ডানে ঘুরুন`
                        : `Turn ${Math.round(rawDiff)}° Right to face Qibla`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base text-amber-600">⬅️</span>
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

          {/* Heading Scrub Slider & Preset Buttons */}
          <div 
            className="p-3 rounded-2xl border space-y-2.5 text-left"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'bn' ? 'দিক নিয়ন্ত্রণ ও টিউনিং:' : 'Heading Slider & Nudge:'}
              </span>
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className="px-2 py-0.5 rounded text-xs bg-emerald-900 text-emerald-100 font-bold">
                  {currentHeading}°
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="359"
              value={currentHeading}
              onChange={(e) => {
                setMode('manual');
                setManualHeading(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-300 dark:bg-slate-700 accent-[#0B3B2C]"
            />

            {/* Step Nudge Buttons */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => nudge(-5)}
                  className="px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors hover:bg-white"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  title="-5° Left"
                >
                  -5°
                </button>
                <button
                  onClick={() => nudge(-1)}
                  className="px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors hover:bg-white"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  title="-1° Left"
                >
                  -1°
                </button>
              </div>

              {/* SNAP TO QIBLA BUTTON */}
              <button
                onClick={() => snapTo(qibla.degrees)}
                className="px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs bg-[#0B3B2C] hover:bg-[#07261C] text-white active:scale-95"
              >
                <span>🕋</span>
                <span>{lang === 'bn' ? `কিবলায় সেট (${qibla.degrees}°)` : `Snap Qibla (${qibla.degrees}°)`}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => nudge(1)}
                  className="px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors hover:bg-white"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  title="+1° Right"
                >
                  +1°
                </button>
                <button
                  onClick={() => nudge(5)}
                  className="px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors hover:bg-white"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  title="+5° Right"
                >
                  +5°
                </button>
              </div>
            </div>

            {/* Quick Cardinal Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => snapTo(0)}
                className="py-1 px-1 rounded-lg text-center text-[11px] font-bold border hover:border-emerald-600 transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {lang === 'bn' ? 'উত্তর (০°)' : 'N (0°)'}
              </button>
              <button
                onClick={() => snapTo(90)}
                className="py-1 px-1 rounded-lg text-center text-[11px] font-bold border hover:border-emerald-600 transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {lang === 'bn' ? 'পূর্ব (৯০°)' : 'E (90°)'}
              </button>
              <button
                onClick={() => snapTo(180)}
                className="py-1 px-1 rounded-lg text-center text-[11px] font-bold border hover:border-emerald-600 transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {lang === 'bn' ? 'দক্ষিণ (১৮০°)' : 'S (180°)'}
              </button>
              <button
                onClick={() => snapTo(270)}
                className="py-1 px-1 rounded-lg text-center text-[11px] font-bold border hover:border-emerald-600 transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {lang === 'bn' ? 'পশ্চিম (২৭০°)' : 'W (270°)'}
              </button>
            </div>
          </div>

          {/* Compass Metrics Readout Cards */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div 
              className="p-3 rounded-2xl border"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)'
              }}
            >
              <span className="text-[11px] block font-medium" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'bn' ? 'সঠিক কিবলা কোণ' : 'Target Bearing'}
              </span>
              <div 
                className="text-lg font-black font-mono mt-0.5"
                style={{ color: 'var(--brand-green)' }}
              >
                {qibla.degrees}° {qibla.compassDirection}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'পশ্চিম-উত্তর-পশ্চিম' : 'West by North'}
              </span>
            </div>

            <div 
              className="p-3 rounded-2xl border"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border-color)'
              }}
            >
              <span className="text-[11px] block font-medium" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'bn' ? 'কা\'বা শরীফের দূরত্ব' : 'Distance to Kaaba'}
              </span>
              <div 
                className="text-lg font-black font-mono mt-0.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {distanceToKaaba.text}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মক্কা মুকাররমা, কেএসএ' : 'Makkah, Saudi Arabia'}
              </span>
            </div>
          </div>

          {/* Calibration / Tip Note */}
          <div 
            className="p-2.5 rounded-xl border text-left text-[11px] leading-relaxed flex items-start gap-2"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            <span className="text-sm">💡</span>
            <span>
              {lang === 'bn'
                ? 'মোবাইলে ব্যবহারের সময় ফোনটি অনুভূমিক (ফ্ল্যাট) রাখুন এবং চুম্বক বা ধাতব বস্তু থেকে দূরে রাখুন।'
                : 'When holding a phone, keep it flat away from metallic or magnetic objects for highest sensor accuracy.'}
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div 
          className="p-3.5 sm:p-4 border-t flex items-center justify-between flex-shrink-0 relative z-10"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Share / Copy Details */}
          <button
            onClick={handleCopyShare}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy Info')}</span>
          </button>

          {/* Done Button */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0B3B2C] hover:bg-[#07261C] text-white font-bold rounded-xl text-xs shadow-xs transition-transform active:scale-95"
          >
            {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
