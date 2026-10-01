'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderNav } from '@/components/HeaderNav';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { MosqueCard } from '@/components/MosqueCard';
import { MosqueDetailsModal } from '@/components/MosqueDetailsModal';
import { AdminPortal } from '@/components/AdminPortal';
import { MasjidMap } from '@/components/MasjidMap';
import { BottomNavBar } from '@/components/BottomNavBar';
import { QiblaCompassModal } from '@/components/QiblaCompassModal';
import { MosqueData } from '@/types/masjid';
import { Search, Filter, AlertTriangle, RefreshCw, Compass, MapPin, Navigation, Sparkles, SlidersHorizontal } from 'lucide-react';
import { BD_LOCATION_PRESETS } from '@/lib/geoUtils';

export default function NearbyMasjidApp() {
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'admin'>('list');
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [showQiblaModal, setShowQiblaModal] = useState<boolean>(false);

  // User Location State - Default to Mirpur Area, Dhaka
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
  const [maxDistanceMeters, setMaxDistanceMeters] = useState<number | null>(null);
  const [nearbyBannerActive, setNearbyBannerActive] = useState<boolean>(false);

  // Selected mosque for details modal or admin quick-edit
  const [selectedMosqueForDetails, setSelectedMosqueForDetails] = useState<MosqueData | null>(null);
  const [selectedMosqueForAdmin, setSelectedMosqueForAdmin] = useState<MosqueData | null>(null);

  const mosqueListRef = useRef<HTMLDivElement>(null);

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
    let ignore = false;
    const loadData = async () => {
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

        if (!ignore) {
          if (data.success) {
            setMosques(data.mosques);
          } else {
            setError(data.error || 'Failed to load mosques from database');
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Fetch error:', err);
          setError((err as Error).message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [location.lat, location.lng, selectedDivision, searchQuery, expiredOnly]);

  // Request Live GPS Location from Browser
  const handleRequestGps = (autoScroll = false) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setNearbyBannerActive(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          area: 'Live GPS Location (সরাসরি জিপিএস)',
          isGps: true
        });
        setGpsLoading(false);
        if (autoScroll && mosqueListRef.current) {
          mosqueListRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setGpsLoading(false);
        // If GPS permission denied or unavailable, use Mirpur preset
        setLocation(prev => ({
          ...prev,
          area: 'Mirpur Area, Dhaka (GPS Fallback)'
        }));
        if (autoScroll && mosqueListRef.current) {
          mosqueListRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Filter mosques by distance radius if selected
  const displayedMosques = mosques.filter((m) => {
    if (maxDistanceMeters === null) return true;
    if (m.distance_meters === undefined) return true;
    return m.distance_meters <= maxDistanceMeters;
  });

  // Count expired timetables
  const expiredCount = mosques.filter(
    (m) => m.prayer?.validity_status === 'expired'
  ).length;

  // Closest mosque prayer for the main next prayer card
  const activeMosquePrayer = displayedMosques[0]?.prayer || mosques[0]?.prayer;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col text-[var(--text-primary)] selection:bg-[#F0F7F4] selection:text-[#0B3B2C] overflow-x-hidden w-full max-w-full transition-colors duration-200">
      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQibla={() => setShowQiblaModal(true)}
        lang={lang}
        setLang={setLang}
        expiredCount={expiredCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12 space-y-5">
        
        {/* ========================================================= */}
        {/* VIEW 1: NEARBY MOSQUES LIST & DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'list' && (
          <div className="space-y-5">
            
            {/* Top Prayer Card & Current Location Header */}
            <NextPrayerCard
              currentLocation={location}
              onLocationChange={setLocation}
              onRequestGps={() => handleRequestGps(false)}
              gpsLoading={gpsLoading}
              activeMosquePrayer={activeMosquePrayer}
              lang={lang}
            />

            {/* Nearby Mosques Discovery CTA Card */}
            <div 
              className="border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              style={{
                backgroundColor: 'var(--brand-green-surface)',
                borderColor: 'var(--brand-green-border)'
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B3B2C] text-[#F3BA47] flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {lang === 'bn' ? 'কাছের মসজিদগুলো দেখুন' : 'Find Mosques Near You'}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {lang === 'bn' 
                      ? 'লাইভ জিপিএস অবস্থান ব্যবহার করে দূরত্বের ক্রমানুসারে নিকটবর্তী মসজিদগুলো সাজান।' 
                      : 'Detects your live location and sorts mosques from closest to furthest.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRequestGps(true)}
                disabled={gpsLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0B3B2C] hover:bg-[#07261C] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 whitespace-nowrap self-stretch sm:self-auto"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? (lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Locating...') : (lang === 'bn' ? '⚡ কাছের মসজিদ খুঁজুন' : '⚡ Find Nearby Mosques')}</span>
              </button>
            </div>

            {/* Expired Timetable Notification Notice (Soft alert with warm contrast) */}
            {expiredCount > 0 && !expiredOnly && (
              <div 
                onClick={() => setExpiredOnly(true)}
                className="bg-[#FFF7ED] border border-[#FDBA74] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-[#9A3412] cursor-pointer hover:bg-[#FFEDD5] transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EA580C] text-white flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#9A3412]">
                      {lang === 'bn' 
                        ? `${expiredCount}টি মসজিদের সময়সূচি হালনাগাদ প্রয়োজন` 
                        : `${expiredCount} mosque timetables need updating`}
                    </h4>
                    <p className="text-[11px] text-[#C2410C]">
                      {lang === 'bn' 
                        ? '১৫ দিনের মেয়াদ শেষ হয়েছে। ফিল্টার করে দেখতে ক্লিক করুন।' 
                        : '15-day validity cycle ended. Click to review mosques needing update.'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#9A3412] bg-white border border-[#FDBA74] px-3 py-1 rounded-lg shadow-2xs hover:bg-[#FFF7ED]">
                  {lang === 'bn' ? 'ফিল্টার' : 'Review'}
                </span>
              </div>
            )}

            {/* Search and Division Filter Toolbar */}
            <div 
              ref={mosqueListRef} 
              className="rounded-2xl p-4 border shadow-xs space-y-3.5 transition-colors"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'bn' ? 'মসজিদের নাম, থানা বা এলাকা দিয়ে খুঁজুন (যেমন: মিরপুর, বরিশাল)...' : 'Search mosque by name, area or road (e.g. Mirpur, Barisal)...'}
                    className="w-full h-11 pl-10 pr-3 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]/20 transition-colors"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <button
                  onClick={fetchMosques}
                  className="h-11 px-3.5 rounded-xl border transition-colors flex items-center justify-center shadow-2xs hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Division Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="font-bold pl-1 flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <Filter className="w-3 h-3" />
                  <span>Division:</span>
                </span>
                {['All', 'Dhaka', 'Barisal', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi'].map((div) => {
                  const isActive = selectedDivision === div && !expiredOnly;
                  return (
                    <button
                      key={div}
                      onClick={() => {
                        setSelectedDivision(div);
                        setExpiredOnly(false);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                        isActive
                          ? 'bg-[#0B3B2C] text-white border-[#0B3B2C] shadow-xs'
                          : 'hover:opacity-80'
                      }`}
                      style={!isActive ? {
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      } : undefined}
                    >
                      {div === 'Barisal' ? (lang === 'bn' ? 'বরিশাল' : 'Barisal') : div}
                    </button>
                  );
                })}

                {expiredOnly && (
                  <button
                    onClick={() => setExpiredOnly(false)}
                    className="px-3.5 py-1.5 rounded-xl font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center gap-1 whitespace-nowrap text-xs shadow-xs"
                  >
                    <span>Clear Expired Filter</span>
                    <span>×</span>
                  </button>
                )}
              </div>

              {/* Proximity / Distance Radius Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t text-xs no-scrollbar" style={{ borderColor: 'var(--border-color)' }}>
                <span className="font-bold pl-1 flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Distance:</span>
                </span>
                {[
                  { label: 'All Distances', labelBn: 'সকল দূরত্ব', max: null },
                  { label: '< 500m', labelBn: '< ৫০০মি', max: 500 },
                  { label: '< 1 km', labelBn: '< ১ কিমি', max: 1000 },
                  { label: '< 3 km', labelBn: '< ৩ কিমি', max: 3000 },
                  { label: '< 5 km', labelBn: '< ৫ কিমি', max: 5000 },
                ].map((item) => {
                  const isActive = maxDistanceMeters === item.max;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setMaxDistanceMeters(item.max)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap border font-medium ${
                        isActive
                          ? 'bg-[#0B3B2C] text-white border-[#0B3B2C] font-bold shadow-xs'
                          : 'hover:opacity-80'
                      }`}
                      style={!isActive ? {
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      } : undefined}
                    >
                      {lang === 'bn' ? item.labelBn : item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mosque Cards List Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Compass className="w-4 h-4" style={{ color: 'var(--brand-green)' }} />
                  <span>{lang === 'bn' ? 'নিকটবর্তী মসজিদসমূহ' : 'Nearby Mosques'}</span>
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {lang === 'bn' 
                    ? `${location.area} অনুযায়ী দূরত্বের ক্রমানুসারে সাজানো` 
                    : `Sorted by distance from ${location.area}`}
                </p>
              </div>

              <span 
                className="text-xs font-bold px-3 py-1 rounded-full border shadow-2xs"
                style={{
                  backgroundColor: 'var(--brand-gold-surface)',
                  color: 'var(--brand-gold-text)',
                  borderColor: 'var(--brand-gold-border)'
                }}
              >
                {displayedMosques.length} {lang === 'bn' ? 'মসজিদ' : 'Found'}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-xs text-[#DC2626] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mosque Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-[14px] overflow-hidden border border-[#E4E9E5] shadow-xs animate-pulse flex flex-col">
                    <div className="h-44 w-full bg-slate-100 relative" />
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="h-12 bg-slate-100 rounded-xl" />
                      <div className="h-6 bg-slate-100 rounded-lg" />
                      <div className="h-8 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedMosques.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-[#E4E9E5] p-8 space-y-3 shadow-[0_1px_3px_rgba(16,24,20,0.04)]">
                <div className="text-3xl">🕌</div>
                <h4 className="font-semibold text-base text-[#18211C]">
                  {lang === 'bn' ? 'কোনো মসজিদ পাওয়া যায়নি' : 'No Mosques Found'}
                </h4>
                <p className="text-xs text-[#66706A] max-w-sm mx-auto">
                  {lang === 'bn' 
                    ? 'আপনার ফিল্টারের আওতায় কোনো মসজিদ পাওয়া যায়নি। অনুগ্রহ করে দূরত্ব বা বিভাগ পরিবর্তন করুন।' 
                    : 'Try clearing your search query or expanding the distance filter.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDivision('All');
                    setExpiredOnly(false);
                    setMaxDistanceMeters(null);
                  }}
                  className="px-4 py-2 bg-[#176B4D] hover:bg-[#124C39] text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedMosques.map((mosque, idx) => (
                  <div key={mosque.id} className="relative">
                    {/* Nearest badge on the top closest mosque */}
                    {idx === 0 && mosque.distance_meters !== undefined && (
                      <div className="absolute -top-2.5 right-3 z-20 bg-[#EEF6F2] text-[#176B4D] px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider border border-[#C2DFD2] shadow-xs">
                        <span>{lang === 'bn' ? 'সবচেয়ে কাছের মসজিদ' : 'Closest Mosque'}</span>
                      </div>
                    )}
                    <MosqueCard
                      mosque={mosque}
                      onViewDetails={setSelectedMosqueForDetails}
                      lang={lang}
                    />
                  </div>
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
            <div className="bg-white rounded-2xl p-4 border border-[#E4E9E5] shadow-[0_1px_3px_rgba(16,24,20,0.04)] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#18211C] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#176B4D]" />
                  <span>{lang === 'bn' ? 'লাইভ মানচিত্রে মসজিদসমূহ' : 'Live Interactive Mosque Map'}</span>
                </h2>
                <p className="text-xs text-[#66706A]">
                  {lang === 'bn' ? 'মানচিত্রের যেকোনো মসজিদে ক্লিক করে বিস্তারিত দেখুন' : 'Click on any mosque pin to view name, distance, and prayer times'}
                </p>
              </div>

              <button
                onClick={() => handleRequestGps(false)}
                disabled={gpsLoading}
                className="px-3.5 py-1.5 bg-[#176B4D] hover:bg-[#124C39] text-white rounded-xl text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
              >
                <span>{gpsLoading ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>

            <MasjidMap
              mosques={displayedMosques}
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
          onDeleteMosque={async (id) => {
            try {
              const res = await fetch(`/api/mosques/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (data.success) {
                setSelectedMosqueForDetails(null);
                fetchMosques();
              } else {
                alert(data.error || 'Failed to remove mosque');
              }
            } catch (err) {
              console.error('Delete error:', err);
            }
          }}
          lang={lang}
        />
      )}

      {/* Subtle Footer */}
      <footer 
        className="border-t py-4 mt-8 text-center text-xs transition-colors"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
            <span>Nearby Masjid</span>
            <span className="text-[10px] font-mono font-normal" style={{ color: 'var(--brand-gold-text)' }}>v1.0 Production BD</span>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            PostgreSQL Database (Supabase) • Live GPS • Barisal & All Divisions • AI OCR Timetable Reader
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQibla={() => setShowQiblaModal(true)}
        lang={lang}
        expiredCount={expiredCount}
      />

      {/* Qibla Direction Compass Modal */}
      {showQiblaModal && (
        <QiblaCompassModal
          userLocation={location}
          onClose={() => setShowQiblaModal(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
