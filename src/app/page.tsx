'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HeaderNav } from '@/components/HeaderNav';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { MosqueCard } from '@/components/MosqueCard';
import { MosqueDetailsModal } from '@/components/MosqueDetailsModal';
import { AdminPortal } from '@/components/AdminPortal';
import { MasjidMap } from '@/components/MasjidMap';
import { MosqueData } from '@/types/masjid';
import { Search, Filter, AlertTriangle, RefreshCw, Compass, MapPin } from 'lucide-react';
import { BD_LOCATION_PRESETS } from '@/lib/geoUtils';

export default function NearbyMasjidApp() {
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'admin'>('list');
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  // User Location State - Default to Mirpur Area, Dhaka (matches prompt's exact example)
  const [location, setLocation] = useState({
    lat: 23.8041,
    lng: 90.3653,
    area: 'Mirpur Area, Dhaka',
    isGps: false
  });
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Mosque list state
  const [mosques, setMosques] = useState<MosqueData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [expiredOnly, setExpiredOnly] = useState<boolean>(false);

  // Selected mosque for details modal or admin quick-edit
  const [selectedMosqueForDetails, setSelectedMosqueForDetails] = useState<MosqueData | null>(null);
  const [selectedMosqueForAdmin, setSelectedMosqueForAdmin] = useState<MosqueData | null>(null);

  // Fetch Mosques from PostgreSQL Database
  const fetchMosques = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (location.lat && location.lng) {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
      }
      if (selectedDivision && selectedDivision !== 'All') {
        params.set('division', selectedDivision);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (expiredOnly) {
        params.set('expiredOnly', 'true');
      }

      const res = await fetch(`/api/mosques?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMosques(data.mosques);
      } else {
        setError(data.error || 'Failed to load mosques from database');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [location.lat, location.lng, selectedDivision, searchQuery, expiredOnly]);

  useEffect(() => {
    fetchMosques();
  }, [fetchMosques]);

  // Request Live GPS Location from Browser
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          area: 'Live GPS Location',
          isGps: true
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setGpsLoading(false);
        // Fallback to preset
        alert('Could not access GPS. Using Mirpur Area as default.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Count expired timetables
  const expiredCount = mosques.filter(
    (m) => m.prayer?.validity_status === 'expired'
  ).length;

  // Closest mosque prayer for the main next prayer card
  const activeMosquePrayer = mosques[0]?.prayer;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        expiredCount={expiredCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-4">
        
        {/* ========================================================= */}
        {/* VIEW 1: NEARBY MOSQUES LIST & DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            
            {/* Top Prayer Card & Current Location Header */}
            <NextPrayerCard
              currentLocation={location}
              onLocationChange={setLocation}
              onRequestGps={handleRequestGps}
              gpsLoading={gpsLoading}
              activeMosquePrayer={activeMosquePrayer}
              lang={lang}
            />

            {/* Expired Timetable Notification Notice (if any mosque has expired validity) */}
            {expiredCount > 0 && !expiredOnly && (
              <div 
                onClick={() => setExpiredOnly(true)}
                className="bg-rose-50 border border-rose-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-rose-900 cursor-pointer hover:bg-rose-100 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold">
                      {lang === 'bn' 
                        ? `${expiredCount}টি মসজিদের সময়সূচি মেয়াদোত্তীর্ণ!` 
                        : `${expiredCount} Mosque Timetables Need Updating!`}
                    </h4>
                    <p className="text-[11px] text-rose-700">
                      {lang === 'bn' 
                        ? '১৫ দিনের মেয়াদ শেষ হয়েছে। নতুন সময়সূচি দেখার জন্য ক্লিক করুন।' 
                        : '15-day validity cycle ended. Click to filter mosques needing update.'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-rose-600 text-white px-2.5 py-1 rounded-lg">
                  {lang === 'bn' ? 'ফিল্টার' : 'Filter'}
                </span>
              </div>
            )}

            {/* Search and Division Filter Bar */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'bn' ? 'মসজিদের নাম বা এলাকা দিয়ে খুঁজুন...' : 'Search mosque by name, area, or road...'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <button
                  onClick={fetchMosques}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Division Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-slate-400 font-semibold pl-1 flex items-center gap-1 text-[11px]">
                  <Filter className="w-3 h-3" />
                  <span>Division:</span>
                </span>
                {['All', 'Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi'].map((div) => (
                  <button
                    key={div}
                    onClick={() => {
                      setSelectedDivision(div);
                      setExpiredOnly(false);
                    }}
                    className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                      selectedDivision === div && !expiredOnly
                        ? 'bg-emerald-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {div}
                  </button>
                ))}

                {expiredOnly && (
                  <button
                    onClick={() => setExpiredOnly(false)}
                    className="px-3 py-1 rounded-full font-bold bg-rose-600 text-white flex items-center gap-1 whitespace-nowrap text-[11px]"
                  >
                    <span>Clear Expired Filter</span>
                    <span>×</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mosque Cards List Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-bold text-sm font-serif text-slate-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-800" />
                  <span>{lang === 'bn' ? 'নিকটবর্তী মসজিদসমূহ' : 'Nearby Mosque List'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' 
                    ? `${location.area} অনুযায়ী দূরত্বে সাজানো` 
                    : `Sorted by distance from ${location.area}`}
                </p>
              </div>

              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {mosques.length} {lang === 'bn' ? 'মসজিদ' : 'Found'}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mosque Cards Grid */}
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                <span>Loading mosques from database...</span>
              </div>
            ) : mosques.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="text-4xl">🕌</div>
                <h4 className="font-bold text-base text-slate-800">
                  {lang === 'bn' ? 'কোনো মসজিদ পাওয়া যায়নি' : 'No Mosques Found'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === 'bn' 
                    ? 'আপনার নির্বাচিত ফিল্টার অথবা এরিয়া অনুযায়ী কোনো মসজিদ নেই। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।' 
                    : 'Try clearing your search query or selecting a different division or location.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDivision('All');
                    setExpiredOnly(false);
                  }}
                  className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mosques.map((mosque) => (
                  <MosqueCard
                    key={mosque.id}
                    mosque={mosque}
                    onViewDetails={setSelectedMosqueForDetails}
                    lang={lang}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: INTERACTIVE LEAFLET / OPENSTREETMAP */}
        {/* ========================================================= */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>{lang === 'bn' ? 'লাইভ মানচিত্রে মসজিদসমূহ' : 'Live Interactive Mosque Map'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'মানচিত্রের যেকোনো মসজিদে ক্লিক করে বিস্তারিত দেখুন' : 'Click on any mosque pin to view name, distance, and prayer times'}
                </p>
              </div>

              <button
                onClick={handleRequestGps}
                disabled={gpsLoading}
                className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <span>{gpsLoading ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>

            <MasjidMap
              mosques={mosques}
              userLocation={location}
              onSelectMosque={setSelectedMosqueForDetails}
              lang={lang}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: ADMIN & OCR TIMETABLE MANAGEMENT HUB */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <AdminPortal
            mosques={mosques}
            onRefresh={fetchMosques}
            lang={lang}
            preselectedMosque={selectedMosqueForAdmin}
          />
        )}

      </main>

      {/* Mosque Details Modal */}
      {selectedMosqueForDetails && (
        <MosqueDetailsModal
          mosque={selectedMosqueForDetails}
          onClose={() => setSelectedMosqueForDetails(null)}
          onOpenAdminUpdate={(mosque) => {
            setSelectedMosqueForAdmin(mosque);
            setActiveTab('admin');
          }}
          lang={lang}
        />
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-serif font-bold text-emerald-950">
            <span>Nearby Masjid</span>
            <span className="text-[10px] text-amber-600 font-mono font-normal">v1.0 Production BD</span>
          </div>
          <div className="text-[11px] text-slate-400">
            PostgreSQL Database • Live GPS • AI OCR Timetable Reader • 15-Day Verification Cycle
          </div>
        </div>
      </footer>
    </div>
  );
}
