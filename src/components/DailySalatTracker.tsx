'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { CheckCircle2, Circle, Flame, Sparkles, RotateCcw, Users, User, Award, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSoftChime, toBnNumber } from '@/lib/islamicUtils';

export interface PrayerCheckItem {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameEn: string;
  nameBn: string;
  icon: string;
  time: string;
}

interface SavedPrayerEntry {
  completed: boolean;
  inJamat: boolean;
  completedAt?: string; // HH:MM AM/PM
}

type DayRecord = Record<string, SavedPrayerEntry>;

interface DailySalatTrackerProps {
  activeMosquePrayer?: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string;
  };
  lang: 'en' | 'bn';
}

const STORAGE_KEY = 'nearby_masjid_daily_salat_records_v1';
const STREAK_KEY = 'nearby_masjid_salat_streak_v1';

const subscribeMounted = () => () => {};

const getDateKey = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function DailySalatTracker({
  activeMosquePrayer = {
    fajr: '05:10 AM',
    dhuhr: '01:15 PM',
    asr: '04:25 PM',
    maghrib: '06:10 PM',
    isha: '08:00 PM',
    jummah: '01:30 PM'
  },
  lang
}: DailySalatTrackerProps) {
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const [todayDateKey] = useState<string>(() => getDateKey());
  const [records, setRecords] = useState<DayRecord>({
    fajr: { completed: false, inJamat: false },
    dhuhr: { completed: false, inJamat: false },
    asr: { completed: false, inJamat: false },
    maghrib: { completed: false, inJamat: false },
    isha: { completed: false, inJamat: false }
  });
  const [streak, setStreak] = useState<number>(0);
  const [isCelebratedToday, setIsCelebratedToday] = useState(false);

  // Determine if today is Friday
  const isFriday = typeof window !== 'undefined' ? new Date().getDay() === 5 : false;

  const prayersList: PrayerCheckItem[] = [
    {
      key: 'fajr',
      nameEn: 'Fajr',
      nameBn: 'ফজর',
      icon: '🌅',
      time: activeMosquePrayer.fajr
    },
    {
      key: 'dhuhr',
      nameEn: isFriday ? 'Jummah' : 'Dhuhr',
      nameBn: isFriday ? "জুমু'আ" : 'যোহর',
      icon: isFriday ? '🕌' : '☀️',
      time: isFriday && activeMosquePrayer.jummah ? activeMosquePrayer.jummah : activeMosquePrayer.dhuhr
    },
    {
      key: 'asr',
      nameEn: 'Asr',
      nameBn: 'আসর',
      icon: '🌤️',
      time: activeMosquePrayer.asr
    },
    {
      key: 'maghrib',
      nameEn: 'Maghrib',
      nameBn: 'মাগরিব',
      icon: '🌇',
      time: activeMosquePrayer.maghrib
    },
    {
      key: 'isha',
      nameEn: 'Isha',
      nameBn: 'এশা',
      icon: '🌙',
      time: activeMosquePrayer.isha
    }
  ];

  // Load records and calculate streak on mount
  useEffect(() => {
    try {
      const todayKey = getDateKey();
      const raw = localStorage.getItem(STORAGE_KEY);
      const allRecords: Record<string, DayRecord> = raw ? JSON.parse(raw) : {};

      let todayData = allRecords[todayKey];
      if (!todayData) {
        todayData = {
          fajr: { completed: false, inJamat: false },
          dhuhr: { completed: false, inJamat: false },
          asr: { completed: false, inJamat: false },
          maghrib: { completed: false, inJamat: false },
          isha: { completed: false, inJamat: false }
        };
        allRecords[todayKey] = todayData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
      }

      // Calculate streak: how many consecutive previous days have 5/5 completed
      let currentStreak = 0;
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);

      while (true) {
        const k = getDateKey(checkDate);
        const dayData = allRecords[k];
        if (dayData && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every((p) => dayData[p]?.completed)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // If today is also 5/5 completed, add 1 to streak
      const todayDone = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every((p) => todayData[p]?.completed);
      if (todayDone) {
        currentStreak++;
      }

      queueMicrotask(() => {
        setRecords(todayData);
        setStreak(currentStreak);
        if (todayDone) {
          setIsCelebratedToday(true);
        }
      });
    } catch (e) {
      console.warn('Error loading daily prayer tracker:', e);
    }
  }, []);

  // Save changes
  const saveTodayRecord = (updated: DayRecord) => {
    setRecords(updated);
    if (!todayDateKey) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const allRecords: Record<string, DayRecord> = raw ? JSON.parse(raw) : {};
      allRecords[todayDateKey] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));

      // Check if all 5 completed
      const allCompleted = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every((k) => updated[k]?.completed);
      if (allCompleted && !isCelebratedToday) {
        setIsCelebratedToday(true);
        triggerCelebration();
        setStreak((prev) => prev + 1);
      }
    } catch (e) {
      console.warn('Error saving prayer tracker:', e);
    }
  };

  // Toggle completion
  const handleTogglePrayer = (key: string) => {
    const current = records[key] || { completed: false, inJamat: false };
    const nextCompleted = !current.completed;
    const nowTimeStr = nextCompleted
      ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : undefined;

    const updated: DayRecord = {
      ...records,
      [key]: {
        ...current,
        completed: nextCompleted,
        completedAt: nowTimeStr,
        // Default to inJamat true if marking completed
        inJamat: nextCompleted ? current.inJamat : false
      }
    };

    saveTodayRecord(updated);
  };

  // Toggle inJamat
  const handleToggleJamat = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = records[key] || { completed: false, inJamat: false };
    // If not completed yet, completing it with jamat
    const nowTimeStr = !current.completed
      ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : current.completedAt;

    const updated: DayRecord = {
      ...records,
      [key]: {
        completed: true,
        inJamat: !current.inJamat,
        completedAt: nowTimeStr
      }
    };
    saveTodayRecord(updated);
  };

  // Reset today
  const handleResetToday = () => {
    if (!confirm(lang === 'bn' ? 'আজকের নামাজের তালিকা রিসেট করতে চান?' : 'Reset today\'s prayer check list?')) {
      return;
    }
    const resetData: DayRecord = {
      fajr: { completed: false, inJamat: false },
      dhuhr: { completed: false, inJamat: false },
      asr: { completed: false, inJamat: false },
      maghrib: { completed: false, inJamat: false },
      isha: { completed: false, inJamat: false }
    };
    setIsCelebratedToday(false);
    saveTodayRecord(resetData);
  };

  // Celebration confetti and chime
  const triggerCelebration = () => {
    playSoftChime();
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#fbbf24', '#047857']
        });
      } catch {
        // ignore
      }
    }
  };

  const completedCount = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter((k) => records[k]?.completed).length;
  const progressPercent = Math.round((completedCount / 5) * 100);
  const jamatCount = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter((k) => records[k]?.completed && records[k]?.inJamat).length;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 transition-all">
      {/* Tracker Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-500/20 text-lg">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base font-serif text-slate-900 leading-tight">
                {lang === 'bn' ? 'আজকের নামাজ ট্র্যাকার' : 'Today\'s Prayer Tracker'}
              </h3>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>
                    {lang === 'bn' ? `${toBnNumber(streak)} দিন` : `${streak} day streak`}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'প্রতি ওয়াক্তের নামাজ শেষে টিক চিহ্ন দিন' : 'Check off prayers as you complete them today'}
            </p>
          </div>
        </div>

        {/* Counter Badge & Reset Button */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
            completedCount === 5
              ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {lang === 'bn' ? `${toBnNumber(completedCount)}/৫ ওয়াক্ত` : `${completedCount}/5 Done`}
          </span>

          {completedCount > 0 && (
            <button
              onClick={handleResetToday}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={lang === 'bn' ? 'আজকের তালিকা রিসেট করুন' : 'Reset today\'s list'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completedCount === 5
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5">
          <span>{lang === 'bn' ? `${toBnNumber(progressPercent)}% সম্পন্ন` : `${progressPercent}% Completed`}</span>
          {jamatCount > 0 && (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600" />
              <span>{lang === 'bn' ? `${toBnNumber(jamatCount)} ওয়াক্ত জামাতে` : `${jamatCount} in Jama'at`}</span>
            </span>
          )}
        </div>
      </div>

      {/* Celebration Banner when 5/5 completed */}
      {completedCount === 5 && (
        <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'মাশাআল্লাহ! ৫ ওয়াক্ত নামাজ সম্পন্ন!' : 'Masha\'Allah! All 5 Prayers Completed!'}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[11px] text-amber-800">
                {lang === 'bn' ? 'আল্লাহ আপনার নামাজ ও সকল নেক আমল কবুল করুন।' : 'May Allah accept your prayers and worship.'}
              </p>
            </div>
          </div>
          <button
            onClick={triggerCelebration}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-[11px] shadow-xs flex-shrink-0"
          >
            {lang === 'bn' ? '🎉 আবার' : '🎉 Celebrate'}
          </button>
        </div>
      )}

      {/* 5 Daily Prayers Checklist Grid */}
      <div className="space-y-2">
        {prayersList.map((prayer) => {
          const item = records[prayer.key] || { completed: false, inJamat: false };
          const isDone = !!item.completed;
          const isJamat = !!item.inJamat;

          return (
            <div
              key={prayer.key}
              onClick={() => handleTogglePrayer(prayer.key)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-700'
              }`}
            >
              {/* Left: Custom Checkbox + Name + Waqt Time */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePrayer(prayer.key);
                  }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                      : 'border-2 border-slate-300 hover:border-emerald-600 bg-white'
                  }`}
                  aria-label={`Mark ${prayer.nameEn} as ${isDone ? 'incomplete' : 'done'}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-transparent" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{prayer.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs sm:text-sm font-bold ${
                        isDone ? 'text-emerald-950 line-through decoration-emerald-500/50' : 'text-slate-900'
                      }`}>
                        {lang === 'bn' ? prayer.nameBn : prayer.nameEn}
                      </span>
                      {isDone && item.completedAt && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-mono">
                          {item.completedAt}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {lang === 'bn' ? `ওয়াক্ত: ${prayer.time}` : `Waqt: ${prayer.time}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Jama'at (Congregation) Pill Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleToggleJamat(prayer.key, e)}
                  title={lang === 'bn' ? 'জামাতে আদায়ের হিসাব' : 'Toggle in Jama\'at'}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                    isDone && isJamat
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : isDone
                      ? 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                      : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-700'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>
                    {isJamat
                      ? (lang === 'bn' ? 'জামাতে' : 'Jama\'at')
                      : (lang === 'bn' ? 'একাকী' : 'Solo')}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
