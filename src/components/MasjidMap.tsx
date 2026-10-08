'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MosqueData } from '@/types/masjid';
import { calculatePrayerCountdown } from '@/lib/prayerTracker';
import { getSafeMosqueImage } from '@/lib/imageUtils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MasjidMapProps {
  mosques: MosqueData[];
  userLocation: {
    lat: number;
    lng: number;
    area: string;
    isGps: boolean;
  };
  onSelectMosque: (mosque: MosqueData) => void;
  lang: 'en' | 'bn';
}

export function MasjidMap({ mosques, userLocation, onSelectMosque, lang }: MasjidMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; invalidateSize: () => void } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedCount, setRenderedCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  const initMap = useCallback(async () => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const L = await import('leaflet');

      // Cleanup existing map if already present
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Safeguard: Leaflet attaches _leaflet_id to the DOM element.
      // Reset it to prevent "Map container is already initialized."
      const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      // Validate user location
      const userLat = Number(userLocation.lat);
      const userLng = Number(userLocation.lng);
      const centerLat = !isNaN(userLat) && Math.abs(userLat) <= 90 ? userLat : 23.8041;
      const centerLng = !isNaN(userLng) && Math.abs(userLng) <= 180 ? userLng : 90.3653;

      const map = L.map(container, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
      });

      // Tile layer with event listeners
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Nearby Masjid BD',
        maxZoom: 19,
      });

      tileLayer.on('tileerror', (e) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[MasjidMap] Tile load error:', (e as { error?: { message?: string } }).error?.message || 'Tile request failed');
        }
      });

      tileLayer.addTo(map);

      // Custom User Location Marker Icon
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; background: #047857; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([centerLat, centerLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px 12px; font-family: sans-serif;">
            <div style="font-weight: bold; color: #064e3b; font-size: 13px;">📍 ${lang === 'bn' ? 'আপনার বর্তমান অবস্থান' : 'Your Live Location'}</div>
            <div style="font-size: 11px; color: #4b5563;">${userLocation.area}</div>
          </div>
        `);

      // Add valid Mosque Markers
      let validPlotted = 0;

      mosques.forEach((mosque) => {
        const mLat = Number(mosque.latitude);
        const mLng = Number(mosque.longitude);

        // Strict coordinate validation
        if (isNaN(mLat) || isNaN(mLng) || Math.abs(mLat) > 90 || Math.abs(mLng) > 180) {
          return;
        }

        const tracking = calculatePrayerCountdown(mosque.prayer || {
          fajr: '05:10 AM',
          dhuhr: '01:15 PM',
          asr: '04:25 PM',
          maghrib: '06:10 PM',
          isha: '08:00 PM',
          jummah: '01:30 PM'
        });

        const mosqueIcon = L.divIcon({
          className: 'mosque-map-marker',
          html: `
            <div style="background: #064e3b; color: #fef08a; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid #fbbf24; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;" aria-label="${mosque.mosque_name_en}">
              🕌
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([mLat, mLng], { icon: mosqueIcon }).addTo(map);
        validPlotted++;

        const safeImg = getSafeMosqueImage(mosque.image);
        const displayName = lang === 'bn' ? (mosque.mosque_name_bn || mosque.mosque_name_en) : mosque.mosque_name_en;

        const popupHtml = `
          <div style="width: 220px; font-family: sans-serif; overflow: hidden; border-radius: 10px;">
            <div style="height: 70px; background-image: url('${safeImg}'); background-size: cover; background-position: center; position: relative;">
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
              ${mosque.distance_text ? `<span style="position: absolute; bottom: 4px; left: 6px; background: #064e3b; color: #fef08a; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${mosque.distance_text}</span>` : ''}
            </div>
            <div style="padding: 10px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #064e3b; line-height: 1.2;">
                ${displayName}
              </h4>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${mosque.address}
              </p>
              <div style="margin-top: 8px; padding: 4px 6px; background: #ecfdf5; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span style="color: #065f46; font-weight: bold;">Next: ${tracking.nextPrayer.nameEn}</span>
                <span style="color: #047857; font-weight: bold; font-family: monospace;">${tracking.nextPrayerTimeFormatted}</span>
              </div>
              <button 
                id="btn-view-${mosque.id}" 
                style="margin-top: 8px; width: 100%; min-height: 36px; padding: 6px 0; background: #064e3b; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;"
              >
                ${lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-view-${mosque.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectMosque(mosque);
            };
          }
        });
      });

      setRenderedCount(validPlotted);
      mapInstanceRef.current = map;

      // Invalidate map size immediately and after layout paint
      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
        setLoading(false);
      }, 150);

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[MasjidMap] Map initialization error:', (err as Error).message);
      }
      setError('Unable to load interactive map. Please check network connection or retry.');
      setLoading(false);
    }
  }, [mosques, userLocation, lang, onSelectMosque]);

  useEffect(() => {
    initMap();

    // Invalidate map size on window resize
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap, retryCount]);

  return (
    <div 
      className="relative w-full h-[65vh] min-h-[420px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg bg-slate-100"
      role="region"
      aria-label={lang === 'bn' ? 'মসজিদ মানচিত্র' : 'Mosque Interactive Map'}
    >
      <div 
        ref={mapContainerRef} 
        id="masjid-map-container"
        className="w-full h-full" 
        style={{ minHeight: '420px', width: '100%' }}
      />

      {/* Loading State Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-emerald-900">
            {lang === 'bn' ? 'মানচিত্র প্রস্তুত হচ্ছে...' : 'Loading interactive map...'}
          </p>
        </div>
      )}

      {/* Error State Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-[1000] bg-rose-50/95 flex flex-col items-center justify-center p-6 text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
          <p className="text-xs font-semibold text-rose-800 max-w-sm">{error}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm touch-target-44"
            aria-label="Retry loading map"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Map'}</span>
          </button>
        </div>
      )}

      {/* Floating Info Overlay — Only shows plotted count if markers actually rendered */}
      {!loading && !error && renderedCount > 0 && (
        <div 
          className="absolute top-3 left-3 z-[1000] bg-emerald-950/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-700/60 shadow-md text-xs flex items-center gap-2"
          aria-live="polite"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">
            {renderedCount} {lang === 'bn' ? 'মসজিদ প্রদর্শিত' : 'Mosques plotted'}
          </span>
        </div>
      )}

      {/* Empty State Overlay if 0 markers rendered */}
      {!loading && !error && renderedCount === 0 && (
        <div 
          className="absolute top-3 left-3 z-[1000] bg-amber-950/90 text-amber-200 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-600/60 shadow-md text-xs flex items-center gap-2"
          aria-live="polite"
        >
          <span>⚠️</span>
          <span className="font-semibold">
            {lang === 'bn' ? 'কোনো মসজিদ পিন নেই' : 'No mosques to plot on map'}
          </span>
        </div>
      )}
    </div>
  );
}
