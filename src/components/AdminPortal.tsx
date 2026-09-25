'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Upload, CheckCircle2, AlertTriangle, RefreshCw,
  Clock, Eye, Edit3, Trash2, Camera, Sparkles, MapPin, Check
} from 'lucide-react';
import { MosqueData } from '@/types/masjid';
import { BANGLADESH_DIVISIONS } from '@/lib/geoUtils';
import { performOcrOnImage } from '@/lib/ocrService';
import { checkTimetableValidity } from '@/lib/prayerTracker';

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
  const [addForm, setAddForm] = useState({
    mosque_name_bn: '',
    mosque_name_en: '',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
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
  });

  const [addLoading, setAddLoading] = useState<boolean>(false);

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
        setSaveSuccess('New mosque successfully registered in database!');
        onRefresh();
        setActiveTab('list');
      } else {
        setSaveError(data.error || 'Failed to create mosque');
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setAddLoading(false);
    }
  };

  // Delete Mosque
  const handleDeleteMosque = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mosque from database?')) return;
    try {
      const res = await fetch(`/api/mosques/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedMosque = mosques.find(m => m.id === selectedMosqueId);

  return (
    <div className="space-y-4">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-2xl p-4 shadow-md border border-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-serif">
                {lang === 'bn' ? 'মসজিদ প্রশাসন ও সময়সূচি নিয়ন্ত্রণ' : 'Mosque Admin Management'}
              </h2>
              <span className="text-[10px] bg-emerald-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">
                POSTGRESQL LIVE
              </span>
            </div>
            <p className="text-xs text-emerald-300">
              {lang === 'bn' ? 'এআই ওসিআর দিয়ে সময়সূচি রিড করুন এবং যাচাই করে প্রকাশ করুন' : 'AI OCR Timetable Verification & Mosque Operations'}
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
      <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ocr'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'bn' ? 'এআই ওসিআর ও সময়সূচি' : 'AI OCR Timetable Studio'}</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'add'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'নতুন মসজিদ যুক্ত করুন' : 'Add Mosque'}</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'list'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'মসজিদ তালিকা' : 'Directory'} ({mosques.length})</span>
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
        <form onSubmit={handleAddMosque} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Plus className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              {lang === 'bn' ? 'নতুন মসজিদ নিবন্ধন' : 'Register New Mosque in Bangladesh'}
            </h3>
          </div>

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

          {/* Coordinates and Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude (অক্ষাংশ) *</label>
              <input
                type="number"
                step="any"
                required
                value={addForm.latitude}
                onChange={(e) => setAddForm({ ...addForm, latitude: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude (দ্রাঘিমাংশ) *</label>
              <input
                type="number"
                step="any"
                required
                value={addForm.longitude}
                onChange={(e) => setAddForm({ ...addForm, longitude: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={addForm.contact}
                onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                placeholder="+880 1711-..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mosque Cover Photo URL</label>
            <input
              type="url"
              value={addForm.image}
              onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
            />
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
      {/* TAB 3: MOSQUE DIRECTORY & VALIDITY MONITOR */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              {lang === 'bn' ? 'সকল মসজিদের ডাটাবেজ তালিকা' : 'Registered Mosques & Timetable Status'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {mosques.length} Mosques
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {mosques.map((m) => {
              const val = checkTimetableValidity(m.prayer?.updated_date, m.prayer?.next_update_date);
              return (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3">
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
                      onClick={() => {
                        setSelectedMosqueId(m.id);
                        setActiveTab('ocr');
                      }}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                      title="Update Timetable"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteMosque(m.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition-colors"
                      title="Delete Mosque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
