'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, placeName?: string) => void;
  lang: 'en' | 'bn';
}

export function LocationPickerMap({ lat, lng, onChange, lang }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; invalidateSize: () => void; setView: (center: [number, number], zoom: number) => void } | null>(null);
  const markerRef = useRef<{ setLatLng: (coords: [number, number]) => void } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      if (!mapContainerRef.current || !isMounted) return;

      const initialLat = typeof lat === 'number' && !isNaN(lat) ? lat : 23.8041;
      const initialLng = typeof lng === 'number' && !isNaN(lng) ? lng : 90.3653;

      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Nearby Masjid Location Picker',
        maxZoom: 19,
      }).addTo(map);

      // Custom Mosque Pin Marker
      const pinIcon = L.divIcon({
        className: 'mosque-pin-picker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background: #064e3b; color: #fbbf24; border: 2.5px solid #d97706; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
              🕌
            </div>
            <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 8px solid #064e3b; margin-top: -1px;"></div>
            <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 1px;"></div>
          </div>
        `,
        iconSize: [38, 48],
        iconAnchor: [19, 47],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      // Click anywhere on map to move marker
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onChange(Number(clickLat.toFixed(6)), Number(clickLng.toFixed(6)));
      });

      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when lat/lng change from outside
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
      mapInstanceRef.current.invalidateSize();
    }
  }, [lat, lng]);

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLat = Number(latitude.toFixed(6));
        const newLng = Number(longitude.toFixed(6));
        onChange(newLat, newLng, 'Live GPS Position');
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 16);
          mapInstanceRef.current.invalidateSize();
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleNominatimSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Bangladesh`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'NearbyMasjidLocationPicker/1.0' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const found = data[0];
        const newLat = parseFloat(found.lat);
        const newLng = parseFloat(found.lon);
        onChange(newLat, newLng, found.display_name.split(',')[0]);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 15);
          mapInstanceRef.current.invalidateSize();
        }
      }
    } catch {
      // Nominatim search fallback
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and GPS Bar */}
      <div className="flex gap-2">
        <form onSubmit={handleNominatimSearch} className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'এলাকা বা থানার নাম লিখে খুঁজুন (যেমন: মিরপুর ১০, বরিশাল)...'
                : 'Search area/road (e.g., Mirpur 10, Guthia Barisal, Dhanmondi)...'
            }
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </form>

        <button
          type="button"
          onClick={handleUseLiveLocation}
          disabled={locating}
          className="h-10 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          title="Use GPS Coordinates"
          aria-label="Use live GPS coordinates"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{lang === 'bn' ? 'আমার জিপিএস' : 'My GPS'}</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-950 font-bold border border-emerald-200 shadow-sm">
          📍 {lat?.toFixed(5) || '0.00000'}, {lng?.toFixed(5) || '0.00000'}
        </div>
      </div>
    </div>
  );
}
