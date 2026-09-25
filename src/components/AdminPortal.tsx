'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Upload, CheckCircle2, AlertTriangle, RefreshCw,
  Clock, Eye, Edit3, Trash2, Camera, Sparkles, MapPin, Check,
  RotateCcw, Save, Image as ImageIcon, Link2, Search
} from 'lucide-react';
import { MosqueData } from '@/types/masjid';
import { BANGLADESH_DIVISIONS } from '@/lib/geoUtils';
import { performOcrOnImage } from '@/lib/ocrService';
import { checkTimetableValidity } from '@/lib/prayerTracker';
import { LocationPickerMap } from '@/components/LocationPickerMap';

const DRAFT_MOSQUE_KEY = 'nearby_masjid_add_draft_v1';
const ADMIN_TAB_KEY = 'nearby_masjid_admin_tab_v1';

export const PRESET_MOSQUE_COVERS = [
  {
    id: 'guthia',
    nameBn: 'গুঠিয়া মসজিদ কমপ্লেক্স (বরিশাল)',
    nameEn: 'Guthia Mosque Complex',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'mukarram',
    nameBn: 'বায়তুল মোকাররম জাতীয় মসজিদ স্টাইল',
    nameEn: 'Baitul Mukarram National Style',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'terracotta',
    nameBn: 'ঐতিহ্যবাহী লাল টেরাকোটা মসজিদ',
    nameEn: 'Traditional Terracotta / Brick Masjid',
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sunset',
    nameBn: 'সূর্যাস্তে সোনালী গম্বুজ ও মিনার',
    nameEn: 'Golden Sunset Dome & Minaret',
    url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'modern',
    nameBn: 'আধুনিক শ্বেতশুভ্র ইসলামিক আর্কিটেকচার',
    nameEn: 'Modern White Islamic Architecture',
    url: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'serene',
    nameBn: 'সবুজ গম্বুজ ও উন্মুক্ত চত্বর',
    nameEn: 'Serene Green Dome & Courtyard',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80'
  }
];

const INITIAL_ADD_FORM = {
  mosque_name_bn: '',
  mosque_name_en: '',
  image: PRESET_MOSQUE_COVERS[0].url,
  address: '',
  division: 'Dhaka',
  district: 'Dhaka',
  upazila: 'Mirpur',
  union_name: '',
  latitude: '23.8041',
  longitude: '90.3653',
  contact: '+880 1',
  // Initial prayer
  fajr: '05:10 AM',
  dhuhr: '01:15 PM',
  asr: '04:25 PM',
  maghrib: '06:10 PM',
  isha: '08:00 PM',
  jummah: '01:30 PM'
};

interface AdminPortalProps {
  mosques: MosqueData[];
  onRefresh: () => void;
  lang: 'en' | 'bn';
  preselectedMosque?: MosqueData | null;
}

export function AdminPortal({ mosques, onRefresh, lang, preselectedMosque }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'ocr' | 'add' | 'list'>('ocr');

  // Selected mosque for prayer timetable update
  const [selectedMosqueId, setSelectedMosqueId] = useState<number>(
    preselectedMosque?.id || mosques[0]?.id || 1
  );

  // OCR state
  const [chartImageUri, setChartImageUri] = useState<string>('/images/charts/sample_ocr_chart.svg');
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrVerified, setOcrVerified] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable prayer timetable fields
  const [timetableForm, setTimetableForm] = useState({
    fajr: '05:10 AM',
    dhuhr: '01:15 PM',
    asr: '04:25 PM',
    maghrib: '06:10 PM',
    isha: '08:00 PM',
    jummah: '01:30 PM',
    validity_days: '15',
    notes: ''
  });

  // Add Mosque Form State
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<boolean>(false);
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [coverPhotoSource, setCoverPhotoSource] = useState<'preset' | 'device' | 'url'>('preset');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>('');

  // Handle Cover Photo Upload from Device / Camera
  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন (JPEG, PNG, WebP)' : 'Please upload a valid image file');
      return;
    }

    setIsCompressingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAddForm((prev) => ({ ...prev, image: compressed }));
          setCoverPhotoSource('device');
        }
        setIsCompressingImage(false);
      };
      img.onerror = () => setIsCompressingImage(false);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Restore draft and active tab from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTab = localStorage.getItem(ADMIN_TAB_KEY);
      if (savedTab && (savedTab === 'ocr' || savedTab === 'add' || savedTab === 'list') && !preselectedMosque) {
        setActiveTab(savedTab as 'ocr' | 'add' | 'list');
      }

      const savedDraft = localStorage.getItem(DRAFT_MOSQUE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          // If at least one custom field was filled
          if (parsed.mosque_name_bn || parsed.mosque_name_en || parsed.address) {
            setAddForm((prev) => ({ ...prev, ...parsed }));
            setDraftRestoredNotice(true);
            setIsFormDirty(true);
          }
        }
      }
    } catch (e) {
      console.warn('Error restoring admin draft:', e);
    }
  }, [preselectedMosque]);

  // Auto-save addForm changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hasContent = Boolean(
        addForm.mosque_name_bn?.trim() ||
        addForm.mosque_name_en?.trim() ||
        addForm.address?.trim()
      );
      if (hasContent) {
        localStorage.setItem(DRAFT_MOSQUE_KEY, JSON.stringify(addForm));
        setIsFormDirty(true);
      }
    } catch (e) {
      console.warn('Error saving admin draft:', e);
    }
  }, [addForm]);

  // Tab switch handler with persistence
  const switchTab = (tab: 'ocr' | 'add' | 'list') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_TAB_KEY, tab);
      } catch (e) {
        console.warn('Error saving admin tab:', e);
      }
    }
  };

  // Discard draft and reset form
  const handleClearDraft = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DRAFT_MOSQUE_KEY);
      } catch (e) {
        console.warn('Error removing admin draft:', e);
      }
    }
    setAddForm(INITIAL_ADD_FORM);
    setDraftRestoredNotice(false);
    setIsFormDirty(false);
  };

  // When preselected mosque changes
  useEffect(() => {
    if (preselectedMosque) {
      setSelectedMosqueId(preselectedMosque.id);
      setActiveTab('ocr');
      if (preselectedMosque.prayer) {
        setTimetableForm({
          fajr: preselectedMosque.prayer.fajr,
          dhuhr: preselectedMosque.prayer.dhuhr,
          asr: preselectedMosque.prayer.asr,
          maghrib: preselectedMosque.prayer.maghrib,
          isha: preselectedMosque.prayer.isha,
          jummah: preselectedMosque.prayer.jummah || '01:30 PM',
          validity_days: '15',
          notes: ''
        });
        if (preselectedMosque.prayer.image) {
          setChartImageUri(preselectedMosque.prayer.image);
        }
      }
    }
  }, [preselectedMosque]);

  // Handle OCR Run
  const handleRunOcr = async () => {
    setOcrLoading(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const result = await performOcrOnImage(chartImageUri);
      setTimetableForm({
        fajr: result.fajr || timetableForm.fajr,
        dhuhr: result.dhuhr || timetableForm.dhuhr,
        asr: result.asr || timetableForm.asr,
        maghrib: result.maghrib || timetableForm.maghrib,
        isha: result.isha || timetableForm.isha,
        jummah: result.jummah || timetableForm.jummah,
        validity_days: '15',
        notes: `AI OCR Confidence: ${result.confidence}%. Admin verification pending.`
      });
      setOcrVerified(false); // Admin must verify before saving!
    } catch (err) {
      console.error('OCR Error:', err);
      setSaveError('Could not process image automatically. You can manually enter prayer times.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle File Upload for Timetable Chart
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setChartImageUri(reader.result as string);
        setOcrVerified(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Timetable to Supabase PostgreSQL Database
  const handleSaveTimetable = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!selectedMosqueId) {
      setSaveError('Please select a mosque');
      return;
    }

    try {
      const res = await fetch(`/api/mosques/${selectedMosqueId}/prayer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fajr: timetableForm.fajr,
          dhuhr: timetableForm.dhuhr,
          asr: timetableForm.asr,
          maghrib: timetableForm.maghrib,
          isha: timetableForm.isha,
          jummah: timetableForm.jummah,
          image: chartImageUri,
          validity_days: timetableForm.validity_days,
          is_verified: true,
          ocr_raw_text: timetableForm.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Prayer timetable successfully verified and saved to database!');
        setOcrVerified(true);
        onRefresh();
      } else {
        setSaveError(data.error || 'Failed to save timetable');
      }
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  // Submit Add Mosque Form
  const handleAddMosque = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/mosques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque_name_bn: addForm.mosque_name_bn,
          mosque_name_en: addForm.mosque_name_en,
          image: addForm.image,
          address: addForm.address,
          division: addForm.division,
          district: addForm.district,
          upazila: addForm.upazila,
          union_name: addForm.union_name,
          latitude: parseFloat(addForm.latitude),
          longitude: parseFloat(addForm.longitude),
          contact: addForm.contact,
          prayer: {
            fajr: addForm.fajr,
            dhuhr: addForm.dhuhr,
            asr: addForm.asr,
            maghrib: addForm.maghrib,
            isha: addForm.isha,
            jummah: addForm.jummah,
            image: '/images/charts/baitul_aman_chart.svg'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(DRAFT_MOSQUE_KEY);
          } catch (e) {
            console.warn(e);
          }
        }
        setAddForm(INITIAL_ADD_FORM);
        setDraftRestoredNotice(false);
        setIsFormDirty(false);
        setSaveSuccess('New mosque successfully registered in database!');
        onRefresh();
        switchTab('list');
      } else {
        setSaveError(data.error || 'Failed to create mosque');
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setAddLoading(false);
    }
  };

  // Delete Mosque permanently
  const handleDeleteMosque = async (id: number, name?: string) => {
    const mosqueName = name || (lang === 'bn' ? 'এই মসজিদটি' : 'this mosque');
    const confirmed = window.confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${mosqueName}" ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
        : `Are you sure you want to permanently delete "${mosqueName}" from the database? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/mosques/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(lang === 'bn' ? `"${mosqueName}" সফলভাবে ডাটাবেজ থেকে মুছে ফেলা হয়েছে` : `"${mosqueName}" removed successfully from database`);
        onRefresh();
      } else {
        setSaveError(data.error || 'Failed to delete mosque');
      }
    } catch (err) {
      console.error(err);
      setSaveError((err as Error).message);
    }
  };

  const selectedMosque = mosques.find(m => m.id === selectedMosqueId);

  return (
    <div className="space-y-4">
      {/* Community Contributor Header Banner - Open for Everyone */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-2xl p-4 shadow-md border border-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-serif">
                {lang === 'bn' ? 'মসজিদ ও সময়সূচি সংযোজন ও আপডেট' : 'Contribute Mosques & Prayer Timetables'}
              </h2>
              <span className="text-[10px] bg-emerald-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">
                {lang === 'bn' ? 'উন্মুক্ত সেবা' : 'OPEN ACCESS'}
              </span>
            </div>
            <p className="text-xs text-emerald-300">
              {lang === 'bn' 
                ? 'যাত্রী বা সাধারণ মুসুল্লি—যেকোনো ব্যক্তি যেকোনো মসজিদের নতুন সময়সূচি বা নতুন মসজিদ যোগ ও আপডেট করতে পারেন' 
                : 'Open for all: Passengers, travelers, and musallis can freely add mosques and update prayer times'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-emerald-900 hover:bg-emerald-800 rounded-xl text-emerald-200 hover:text-white transition-colors border border-emerald-700/60"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-slate-200/80 p-1 rounded-xl w-full">
        <button
          onClick={() => switchTab('ocr')}
          className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
            activeTab === 'ocr'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">{lang === 'bn' ? 'ওসিআর সময়সূচি' : 'OCR Timetable'}</span>
        </button>

        <button
          onClick={() => switchTab('add')}
          className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
            activeTab === 'add'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
          <span className="truncate">{lang === 'bn' ? 'নতুন মসজিদ' : 'Add Mosque'}</span>
        </button>

        <button
          onClick={() => switchTab('list')}
          className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
            activeTab === 'list'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span className="truncate">{lang === 'bn' ? 'মসজিদ মুছুন' : 'Remove'} ({mosques.length})</span>
        </button>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-900 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: AI OCR PRAYER TIMETABLE MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'ocr' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-5">
          
          {/* Select Mosque Header */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'bn' ? 'মসজিদ নির্বাচন করুন:' : 'Select Mosque to Update Timetable:'}
            </label>
            <select
              value={selectedMosqueId}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                setSelectedMosqueId(id);
                const found = mosques.find(m => m.id === id);
                if (found && found.prayer) {
                  setTimetableForm({
                    fajr: found.prayer.fajr,
                    dhuhr: found.prayer.dhuhr,
                    asr: found.prayer.asr,
                    maghrib: found.prayer.maghrib,
                    isha: found.prayer.isha,
                    jummah: found.prayer.jummah || '01:30 PM',
                    validity_days: '15',
                    notes: ''
                  });
                  if (found.prayer.image) {
                    setChartImageUri(found.prayer.image);
                  }
                }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {mosques.map((m) => {
                const val = checkTimetableValidity(m.prayer?.updated_date, m.prayer?.next_update_date);
                return (
                  <option key={m.id} value={m.id}>
                    {m.mosque_name_bn} ({m.mosque_name_en}) — {m.address} {val.isExpired ? '⚠️ [EXPIRED - NEEDS UPDATE]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* AI OCR Instruction Banner (Critical Prompt Requirement) */}
          <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{lang === 'bn' ? 'এআই ওসিআর সহায়তা ও ভেরিফিকেশন নীতি:' : 'AI OCR Assistance & Verification Policy:'}</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              <strong>Important:</strong> AI should only assist reading images. Admin must verify before saving. Never automatically publish wrong prayer times.
            </p>
          </div>

          {/* Grid: Left: Image Upload & Preview | Right: Extracted Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Upload & Timetable Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'সময়সূচি চার্ট ইমেজ আপলোড' : 'Mosque Prayer Chart Image'}</span>
                </span>
                <span className="text-[11px] text-slate-500">Bangla & English</span>
              </div>

              {/* Upload Input & Sample Selector */}
              <div className="space-y-2">
                <input
                  type="file"
                  id="chartUpload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="chartUpload"
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 border-dashed rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'ডিভাইস থেকে ছবি আপলোড করুন' : 'Upload Timetable Photo from Device'}</span>
                </label>

                {/* Quick Sample Selector */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Sample Charts:</span>
                  <button
                    type="button"
                    onClick={() => setChartImageUri('/images/charts/baitul_aman_chart.svg')}
                    className="underline hover:text-emerald-700 font-semibold"
                  >
                    Baitul Aman
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setChartImageUri('/images/charts/noor_masjid_chart.svg')}
                    className="underline hover:text-emerald-700 font-semibold"
                  >
                    Noor Masjid
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setChartImageUri('/images/charts/sample_ocr_chart.svg')}
                    className="underline hover:text-emerald-700 font-semibold"
                  >
                    Bengali OCR Sample
                  </button>
                </div>
              </div>

              {/* Chart Image Preview Box */}
              <div className="w-full h-64 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chartImageUri}
                  alt="Prayer Chart Preview"
                  className="w-full h-full object-contain p-2"
                />
              </div>

              {/* Trigger AI OCR Button */}
              <button
                type="button"
                onClick={handleRunOcr}
                disabled={ocrLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-amber-400 ${ocrLoading ? 'animate-spin' : ''}`} />
                <span>
                  {ocrLoading 
                    ? (lang === 'bn' ? 'ওসিআর রিড করা হচ্ছে...' : 'AI Reading Bengali/English Times...') 
                    : (lang === 'bn' ? 'এআই দিয়ে চার্ট রিড করুন (Run OCR)' : 'Run AI OCR on Chart Image')}
                </span>
              </button>
            </div>

            {/* Right: Extracted & Editable Times */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'যাচাইযোগ্য ওয়াক্তের সময়সূচি' : 'Extracted Prayer Times (Verify & Edit)'}</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-900 font-bold px-2 py-0.5 rounded">
                  Verification Required
                </span>
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'fajr', bn: 'ফজর (Fajr)', default: '05:10 AM' },
                  { key: 'dhuhr', bn: 'যোহর (Dhuhr)', default: '01:15 PM' },
                  { key: 'asr', bn: 'আসর (Asr)', default: '04:25 PM' },
                  { key: 'maghrib', bn: 'মাগরিব (Maghrib)', default: '06:10 PM' },
                  { key: 'isha', bn: 'এশা (Isha)', default: '08:00 PM' },
                  { key: 'jummah', bn: "জুমু'আ (Jummah)", default: '01:30 PM' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {item.bn}
                    </label>
                    <input
                      type="text"
                      value={(timetableForm as Record<string, string>)[item.key] || ''}
                      onChange={(e) =>
                        setTimetableForm({ ...timetableForm, [item.key]: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={item.default}
                    />
                  </div>
                ))}
              </div>

              {/* 15-Day Timetable Validity Cycle Selection (Explicit Requirement) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'সময়সূচির মেয়াদ (Validity Cycle):' : 'Timetable Validity Cycle (Days):'}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={timetableForm.validity_days}
                    onChange={(e) => setTimetableForm({ ...timetableForm, validity_days: e.target.value })}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="15">15 Days (Recommended Cycle - ১৫ দিন)</option>
                    <option value="7">7 Days (১ সপ্তাহ)</option>
                    <option value="30">30 Days (১ মাস)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {lang === 'bn' 
                    ? '১৫ দিন পর অ্যাপ স্বয়ংক্রিয়ভাবে "Please update mosque prayer timetable" নোটিফিকেশন প্রদর্শন করবে।' 
                    : 'System will notify "Please update mosque prayer timetable" once this validity expires.'}
                </p>
              </div>

              {/* Confirm & Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveTimetable}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {lang === 'bn' 
                      ? 'যাচাই সম্পন্ন: সময়সূচি সেভ ও প্রকাশ করুন' 
                      : 'Admin Verified: Save & Publish Timetable'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ADD NEW MOSQUE */}
      {/* ======================================================== */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddMosque} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-800" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  {lang === 'bn' ? 'নতুন মসজিদ নিবন্ধন' : 'Register New Mosque in Bangladesh'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'তথ্য পূরণ করুন, রিফ্রেশ করলেও ড্রাফট মুছে যাবে না' : 'Draft auto-saves continuously and persists across page refreshes'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <span>{lang === 'bn' ? 'কোনো মসজিদ মুছে ফেলতে চান?' : 'Want to remove an existing mosque?'}</span>
                  <button
                    type="button"
                    onClick={() => switchTab('list')}
                    className="text-rose-700 hover:text-rose-800 font-bold underline flex items-center gap-0.5 ml-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>{lang === 'bn' ? 'এখানে ক্লিক করে মুছুন' : 'Click here to Remove Mosques'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFormDirty && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'bn' ? 'ড্রাফট সংরক্ষিত' : 'Auto-Saved'}</span>
                </span>
              )}

              {isFormDirty && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Discard Draft"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'ড্রাফট মুছুন' : 'Clear Draft'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Draft Restored Banner */}
          {draftRestoredNotice && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আপনার পূর্ববর্তী অসম্পূর্ণ মসজিদের তথ্য সফলভাবে উদ্ধার করা হয়েছে!'
                    : 'Your previous mosque registration draft was automatically recovered!'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDraftRestoredNotice(false)}
                className="text-[11px] font-bold text-amber-800 hover:underline px-2 py-0.5"
              >
                {lang === 'bn' ? 'ঠিক আছে' : 'Dismiss'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bangla Name (বাংলা নাম) *
              </label>
              <input
                type="text"
                required
                value={addForm.mosque_name_bn}
                onChange={(e) => setAddForm({ ...addForm, mosque_name_bn: e.target.value })}
                placeholder="যেমন: বাইতুল ফালাহ জামে মসজিদ"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                English Name *
              </label>
              <input
                type="text"
                required
                value={addForm.mosque_name_en}
                onChange={(e) => setAddForm({ ...addForm, mosque_name_en: e.target.value })}
                placeholder="e.g. Baitul Falah Jame Masjid"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Address (ঠিকানা) *
            </label>
            <input
              type="text"
              required
              value={addForm.address}
              onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              placeholder="যেমন: রোড ৩, ব্লক-সি, মিরপুর-১১, ঢাকা-১২১৬"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Division, District, Upazila, Union Cascaded Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Division *</label>
              <select
                value={addForm.division}
                onChange={(e) => setAddForm({ ...addForm, division: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              >
                {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                required
                value={addForm.district}
                onChange={(e) => setAddForm({ ...addForm, district: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upazila / Thana *</label>
              <input
                type="text"
                required
                value={addForm.upazila}
                onChange={(e) => setAddForm({ ...addForm, upazila: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Union / Ward</label>
              <input
                type="text"
                value={addForm.union_name}
                onChange={(e) => setAddForm({ ...addForm, union_name: e.target.value })}
                placeholder="Ward 10"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* INTUITIVE LOCATION PICKER (MAP CLICK, GPS, ROAD SEARCH) */}
          {/* ======================================================== */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>
                  {lang === 'bn' 
                    ? 'মসজিদের সঠিক অবস্থান নির্বাচন (ম্যাপে ক্লিক / সার্চ / জিপিএস)' 
                    : 'Mosque Exact Location (Click Map / Search Place / One-Click GPS)'}
                </span>
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                {lang === 'bn' ? 'সহজ পদ্ধতি' : 'Easy Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              {lang === 'bn'
                ? 'স্থানাঙ্ক মুখস্থ করার প্রয়োজন নেই! এলাকা বা রোডের নাম দিয়ে খুঁজুন, ম্যাপে ক্লিক করে পিন বসান, অথবা মসজিদে অবস্থানকালে "📍 বর্তমান লোকেশন নিন" চাপুন।'
                : 'No need to know numeric coordinates! Search area name, click/drag the pin on the map, or tap "📍 Use My GPS" while standing at the mosque.'}
            </p>

            {/* Interactive Leaflet Location Picker */}
            <LocationPickerMap
              lat={parseFloat(addForm.latitude) || 23.8041}
              lng={parseFloat(addForm.longitude) || 90.3653}
              onChange={(newLat, newLng) => {
                setAddForm((prev) => ({
                  ...prev,
                  latitude: newLat.toString(),
                  longitude: newLng.toString()
                }));
              }}
              lang={lang}
            />
          </div>

          {/* Coordinates and Contact Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Latitude (অক্ষাংশ) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={addForm.latitude}
                onChange={(e) => setAddForm({ ...addForm, latitude: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Longitude (দ্রাঘিমাংশ) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={addForm.longitude}
                onChange={(e) => setAddForm({ ...addForm, longitude: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Number (যোগাযোগ)
              </label>
              <input
                type="text"
                value={addForm.contact}
                onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                placeholder="+880 1711-..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* MOSQUE COVER PHOTO SECTION (UPLOAD / PRESETS / URL) */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>
                  {lang === 'bn' ? 'মসজিদের কভার ছবি (Cover Photo)' : 'Mosque Cover Photo'}
                </span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {coverPhotoSource === 'device' 
                  ? (lang === 'bn' ? '📸 ডিভাইস থেকে আপলোডকৃত' : '📸 Custom Device Photo') 
                  : coverPhotoSource === 'url'
                  ? (lang === 'bn' ? '🔗 কাস্টম ওয়েব লিঙ্ক' : '🔗 Web Image Link')
                  : (lang === 'bn' ? '🖼️ গ্যালারি প্রিসেট' : '🖼️ Preset Selected')}
              </span>
            </div>

            {/* Live Cover Photo Card Preview */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-inner group">
              {addForm.image ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAddForm((prev) => ({ ...prev, image: '' }));
                      setCoverPhotoSource('preset');
                    }}
                    className="absolute top-3 right-3 z-10 px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-colors backdrop-blur-sm"
                    title={lang === 'bn' ? 'কভার ছবি মুছুন' : 'Remove cover photo'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ছবি মুছুন (Remove)' : 'Remove Photo'}</span>
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={addForm.image}
                    alt="Cover Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800 p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'bn' ? 'কোনো কভার ছবি নির্বাচিত নেই' : 'No Cover Photo Selected'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'নিচ থেকে ক্যামেরা/ডিভাইস ছবি আপলোড করুন অথবা প্রিসেট বেছে নিন' : 'Upload from device/camera or choose an architectural preset below'}
                  </span>
                </div>
              )}
              
              {/* Overlay preview labels */}
              {addForm.image && (
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[10px] bg-emerald-700 text-amber-300 font-bold px-2 py-0.5 rounded-full inline-block mb-1 shadow">
                    {lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview in App'}
                  </div>
                  <h4 className="text-sm font-bold font-serif leading-tight truncate">
                    {addForm.mosque_name_bn || (lang === 'bn' ? 'মসজিদের নাম এখানে প্রদর্শিত হবে' : 'Mosque Name Preview')}
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate">
                    {addForm.mosque_name_en || (lang === 'bn' ? 'ইংরেজি নাম' : 'English Name')} • {addForm.address || (lang === 'bn' ? 'ঠিকানা' : 'Address')}
                  </p>
                </div>
              )}

              {isCompressingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold gap-2 z-20">
                  <Camera className="w-5 h-5 animate-pulse text-amber-400" />
                  <span>{lang === 'bn' ? 'ছবি প্রসেস হচ্ছে...' : 'Optimizing photo...'}</span>
                </div>
              )}
            </div>

            {/* Upload from Device / Camera button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                id="mosqueCoverUpload"
                accept="image/*"
                onChange={handleCoverPhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="mosqueCoverUpload"
                className="flex-1 py-2.5 px-4 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>
                  {lang === 'bn' 
                    ? 'ডিভাইস বা ক্যামেরা থেকে ছবি আপলোড করুন' 
                    : 'Upload from Device / Camera Photo'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
              >
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'bn' ? 'ওয়েব লিঙ্ক (URL)' : 'Web URL'}</span>
              </button>

              {addForm.image && (
                <button
                  type="button"
                  onClick={() => {
                    setAddForm((prev) => ({ ...prev, image: '' }));
                    setCoverPhotoSource('preset');
                  }}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  title="Remove selected cover photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ছবি মুছুন' : 'Remove Photo'}</span>
                </button>
              )}
            </div>

            {/* Optional URL Input */}
            {showUrlInput && (
              <div className="space-y-1 animate-in fade-in">
                <input
                  type="url"
                  value={addForm.image}
                  onChange={(e) => {
                    setAddForm({ ...addForm, image: e.target.value });
                    setCoverPhotoSource('url');
                  }}
                  placeholder="https://example.com/mosque-photo.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'যেকোনো পাবলিক ইমেজ লিঙ্ক সরাসরি পেস্ট করতে পারেন' : 'Paste any direct public image URL'}
                </p>
              </div>
            )}

            {/* Curated Preset Mosque Photo Gallery */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold text-slate-600 mb-2">
                {lang === 'bn' ? 'অথবা পছন্দের মসজিদ প্রিসেট ছবি বেছে নিন:' : 'Or choose from curated architectural presets:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_MOSQUE_COVERS.map((preset) => {
                  const isSelected = addForm.image === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAddForm({ ...addForm, image: preset.url });
                        setCoverPhotoSource('preset');
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 text-left group transition-all ${
                        isSelected 
                          ? 'border-amber-500 shadow-md ring-2 ring-amber-400/40' 
                          : 'border-slate-200 hover:border-emerald-500'
                      }`}
                    >
                      <div className="h-16 w-full bg-slate-100 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.nameEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-emerald-950 p-1 rounded-full shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 bg-white">
                        <div className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                          {lang === 'bn' ? preset.nameBn : preset.nameEn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={addLoading}
            className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{addLoading ? 'নিবন্ধন হচ্ছে...' : 'Create Mosque & Initialize Prayer Schedule'}</span>
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MOSQUE DIRECTORY & REMOVE OPERATIONS */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{lang === 'bn' ? 'মসজিদ তালিকা ও মুছে ফেলার অপশন' : 'Mosque Directory & Remove Operations'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn' 
                  ? 'যেকোনো মসজিদ ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে লাল "মুছে ফেলুন" বাটনে ক্লিক করুন।' 
                  : 'Click the red "Remove Mosque" button to permanently delete any mosque from the database.'}
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
              {lang === 'bn' ? `মোট ${mosques.length} টি মসজিদ` : `Total ${mosques.length} Mosques`}
            </span>
          </div>

          {/* Search box to quickly find mosque to delete */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম বা এলাকা দিয়ে মসজিদ খুঁজুন...' : 'Search mosque by name or address to remove...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* List of Mosques */}
          <div className="divide-y divide-slate-100">
            {mosques
              .filter((m) => {
                if (!directorySearch.trim()) return true;
                const q = directorySearch.toLowerCase();
                return (
                  m.mosque_name_bn?.toLowerCase().includes(q) ||
                  m.mosque_name_en?.toLowerCase().includes(q) ||
                  m.address?.toLowerCase().includes(q) ||
                  m.district?.toLowerCase().includes(q)
                );
              })
              .map((m) => {
                const val = checkTimetableValidity(m.prayer?.updated_date, m.prayer?.next_update_date);
                return (
                  <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image}
                        alt={m.mosque_name_en}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                          {m.mosque_name_bn}
                        </h4>
                        <p className="text-[11px] text-slate-500">{m.mosque_name_en}</p>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.address}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                        val.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {val.isExpired ? '⚠️ Expired' : `${val.daysRemaining}d valid`}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMosqueId(m.id);
                          switchTab('ocr');
                        }}
                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Update Timetable"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{lang === 'bn' ? 'সময়সূচি' : 'Timetable'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMosque(m.id, m.mosque_name_bn || m.mosque_name_en)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group whitespace-nowrap"
                        title={lang === 'bn' ? 'মসজিদটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলুন' : 'Permanently remove mosque from database'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                        <span>{lang === 'bn' ? 'মুছে ফেলুন (Remove)' : 'Remove Mosque'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
