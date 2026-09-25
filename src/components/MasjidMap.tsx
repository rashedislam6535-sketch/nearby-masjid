'use client';

import React, { useEffect, useRef } from 'react';
import { MosqueData } from '@/types/masjid';
import { calculatePrayerCountdown } from '@/lib/prayerTracker';

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
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      // Cleanup existing map if re-rendering
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      if (!mapContainerRef.current || !isMounted) return;

      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: true,
      });

      // High performance OpenStreetMap CartoDB Positron / OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Nearby Masjid BD',
        maxZoom: 19,
      }).addTo(map);

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

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px 12px; font-family: sans-serif;">
            <div style="font-weight: bold; color: #064e3b; font-size: 13px;">📍 ${lang === 'bn' ? 'আপনার বর্তমান অবস্থান' : 'Your Live Location'}</div>
            <div style="font-size: 11px; color: #4b5563;">${userLocation.area}</div>
          </div>
        `);

      // Add Mosque Markers
      mosques.forEach((mosque) => {
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
            <div style="background: #064e3b; color: #fef08a; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid #fbbf24; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
              🕌
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([mosque.latitude, mosque.longitude], { icon: mosqueIcon }).addTo(map);

        const popupHtml = `
          <div style="width: 220px; font-family: sans-serif; overflow: hidden; border-radius: 10px;">
            <div style="height: 70px; background-image: url('${mosque.image}'); background-size: cover; background-position: center; position: relative;">
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
              ${mosque.distance_text ? `<span style="position: absolute; bottom: 4px; left: 6px; background: #064e3b; color: #fef08a; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${mosque.distance_text}</span>` : ''}
            </div>
            <div style="padding: 10px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #064e3b; line-height: 1.2;">
                ${lang === 'bn' ? mosque.mosque_name_bn : mosque.mosque_name_en}
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
                style="margin-top: 8px; width: 100%; padding: 6px 0; background: #064e3b; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;"
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

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mosques, userLocation, lang, onSelectMosque]);

  return (
    <div className="relative w-full h-[65vh] min-h-[420px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-emerald-950/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-700/60 shadow-md text-xs flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold">
          {mosques.length} {lang === 'bn' ? 'মসজিদ প্রদর্শিত' : 'Mosques plotted'}
        </span>
      </div>
    </div>
  );
}
