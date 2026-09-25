'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Check, Sparkles } from 'lucide-react';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, placeName?: string) => void;
  lang: 'en' | 'bn';
}

export function LocationPickerMap({ lat, lng, onChange, lang }: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat, lng });

  useEffect(() => {
    setCurrentCoords({ lat, lng });
  }, [lat, lng]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      if (!mapContainerRef.current || !isMounted) return;

      const initialLat = currentCoords.lat || 23.8041;
      const initialLng = currentCoords.lng || 90.3653;

      const map = L.map(mapContainerRef.current, {
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
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      // Click anywhere on map to move marker
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        setCurrentCoords({ lat: clickLat, lng: clickLng });
        onChange(Number(clickLat.toFixed(6)), Number(clickLng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coords change from search or GPS
  const updateMapPosition = (newLat: number, newLng: number) => {
    setCurrentCoords({ lat: newLat, lng: newLng });
    onChange(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)));

    if (mapInstanceRef.current && markerRef.current) {
      const map = mapInstanceRef.current as { setView: (coords: [number, number], zoom: number) => void };
      const marker = markerRef.current as { setLatLng: (coords: [number, number]) => void };
      map.setView([newLat, newLng], 16);
      marker.setLatLng([newLat, newLng]);
    }
  };

  // Search location using OpenStreetMap Nominatim (Bangladesh)
  const handleSearchPlace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Bangladesh'
        )}&countrycodes=bd&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        updateMapPosition(newLat, newLng);
      } else {
        alert(lang === 'bn' ? 'স্থানটি পাওয়া যায়নি, অনুগ্রহ করে অন্য নাম দিয়ে খুঁজুন।' : 'Location not found. Try searching with city or road name.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Detect live GPS location
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMapPosition(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setLocating(false);
        alert('Could not detect GPS location. You can click on the map to place the pin.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-sm">
      {/* Search and GPS Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <form onSubmit={handleSearchPlace} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'এলাকা দিয়ে খুঁজুন (যেমন: মিরপুর ১০, গুঠিয়া বরিশাল, ধানমন্ডি)...'
                : 'Search area/road (e.g., Mirpur 10, Guthia Barisal, Dhanmondi)...'
            }
            className="w-full pl-9 pr-20 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-60"
          >
            {searching ? '...' : (lang === 'bn' ? 'খুঁজুন' : 'Search')}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={locating}
          className="w-full sm:w-auto px-3 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Locating...' : (lang === 'bn' ? '📍 বর্তমান লোকেশন নিন' : '📍 Use My GPS')}</span>
        </button>
      </div>

      {/* Interactive Map Box */}
      <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Helper overlay instruction */}
        <div className="absolute top-2 left-2 z-[1000] bg-emerald-950/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 shadow-md pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'bn' ? 'ম্যাপে ক্লিক করে পিন বসান বা ড্র্যাগ করুন' : 'Click on map or drag pin to set exact location'}</span>
        </div>
      </div>

      {/* Selected Coordinates Display */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">
            {lang === 'bn' ? 'নির্বাচিত স্থানাঙ্ক:' : 'Selected Coordinates:'}
          </span>
          <code className="bg-emerald-50 text-emerald-950 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-emerald-200">
            {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
          </code>
        </div>
        <span className="text-[11px] text-slate-500">
          ✓ {lang === 'bn' ? 'সরাসরি ফর্মে যুক্ত হয়েছে' : 'Auto-filled into form'}
        </span>
      </div>
    </div>
  );
}
