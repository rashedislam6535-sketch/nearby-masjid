/**
 * Prayer tracking calculations and timetable validity checks
 */

export interface WaqtDefinition {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameEn: string;
  nameBn: string;
}

export const WAQTS: WaqtDefinition[] = [
  { key: 'fajr', nameEn: 'Fajr', nameBn: 'ফজর' },
  { key: 'dhuhr', nameEn: 'Dhuhr', nameBn: 'যোহর' },
  { key: 'asr', nameEn: 'Asr', nameBn: 'আসর' },
  { key: 'maghrib', nameEn: 'Maghrib', nameBn: 'মাগরিব' },
  { key: 'isha', nameEn: 'Isha', nameBn: 'এশা' },
];

/**
 * Parses time strings like "05:10 AM", "5:10", "13:15", "01:15 PM" into today's Date object
 */
export function parseTimeStringToDate(timeStr: string, baseDate = new Date()): Date {
  const date = new Date(baseDate);
  const clean = timeStr.trim().toUpperCase();
  
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numbersPart = clean.replace(/[^\d:]/g, '');
  const [hStr, mStr] = numbersPart.split(':');
  
  let hours = parseInt(hStr || '0', 10);
  const minutes = parseInt(mStr || '0', 10);

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

export interface PrayerTrackingCalculation {
  currentPrayer: WaqtDefinition | null;
  isRunningNow: boolean;
  activePrayerName: string | null;
  statusBanner: string;
  nextPrayer: WaqtDefinition;
  nextPrayerTimeFormatted: string;
  nextPrayerDate: Date;
  diffMinutes: number;
  diffSeconds: number;
  countdownText: string;
  isToday: boolean;
}

export function calculatePrayerCountdown(
  prayerSchedule: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string;
  },
  now = new Date()
): PrayerTrackingCalculation {
  const isFriday = now.getDay() === 5;
  const dhuhrNameEn = isFriday ? 'Jummah' : 'Dhuhr';
  const dhuhrNameBn = isFriday ? "জুমু'আ" : 'যোহর';

  const scheduleList = [
    {
      def: { key: 'fajr' as const, nameEn: 'Fajr', nameBn: 'ফজর' },
      date: parseTimeStringToDate(prayerSchedule.fajr, now),
      timeStr: prayerSchedule.fajr
    },
    {
      def: { key: 'dhuhr' as const, nameEn: dhuhrNameEn, nameBn: dhuhrNameBn },
      date: parseTimeStringToDate(isFriday && prayerSchedule.jummah ? prayerSchedule.jummah : prayerSchedule.dhuhr, now),
      timeStr: isFriday && prayerSchedule.jummah ? prayerSchedule.jummah : prayerSchedule.dhuhr
    },
    {
      def: { key: 'asr' as const, nameEn: 'Asr', nameBn: 'আসর' },
      date: parseTimeStringToDate(prayerSchedule.asr, now),
      timeStr: prayerSchedule.asr
    },
    {
      def: { key: 'maghrib' as const, nameEn: 'Maghrib', nameBn: 'মাগরিব' },
      date: parseTimeStringToDate(prayerSchedule.maghrib, now),
      timeStr: prayerSchedule.maghrib
    },
    {
      def: { key: 'isha' as const, nameEn: 'Isha', nameBn: 'এশা' },
      date: parseTimeStringToDate(prayerSchedule.isha, now),
      timeStr: prayerSchedule.isha
    }
  ];

  // Sort chronologically
  scheduleList.sort((a, b) => a.date.getTime() - b.date.getTime());

  const nowMs = now.getTime();

  // Check if any prayer is currently running (e.g., from prayer jamat time up to 25 minutes after)
  let currentRunning: typeof scheduleList[0] | null = null;
  for (const item of scheduleList) {
    const startMs = item.date.getTime();
    const endMs = startMs + 25 * 60 * 1000; // 25 min jamat window
    if (nowMs >= startMs && nowMs <= endMs) {
      currentRunning = item;
      break;
    }
  }

  // Find next upcoming prayer
  let nextItem = scheduleList.find(item => item.date.getTime() > nowMs);
  let isToday = true;

  // If all prayers for today have passed, next is tomorrow's Fajr
  if (!nextItem) {
    isToday = false;
    const tomorrowFajr = parseTimeStringToDate(prayerSchedule.fajr, now);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    nextItem = {
      def: { key: 'fajr', nameEn: 'Fajr', nameBn: 'ফজর' },
      date: tomorrowFajr,
      timeStr: prayerSchedule.fajr
    };
  }

  const diffMs = Math.max(0, nextItem.date.getTime() - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(totalSeconds / 60);
  const diffSeconds = totalSeconds % 60;

  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;

  let countdownText = '';
  if (hours > 0) {
    countdownText = `${hours} hr ${remainingMins} min`;
  } else {
    countdownText = `${diffMinutes} minutes`;
  }

  let statusBanner = '';
  if (currentRunning) {
    statusBanner = `${currentRunning.def.nameEn} prayer time started (${currentRunning.def.nameBn} জামাত চলছে)`;
  } else {
    statusBanner = `${countdownText} remaining until ${nextItem.def.nameEn}`;
  }

  return {
    currentPrayer: currentRunning ? currentRunning.def : null,
    isRunningNow: !!currentRunning,
    activePrayerName: currentRunning ? currentRunning.def.nameEn : null,
    statusBanner,
    nextPrayer: nextItem.def,
    nextPrayerTimeFormatted: nextItem.timeStr,
    nextPrayerDate: nextItem.date,
    diffMinutes,
    diffSeconds,
    countdownText,
    isToday
  };
}

/**
 * Checks the 15-day validity period of a mosque's timetable
 */
export function checkTimetableValidity(updatedDateStr?: string | Date, nextUpdateDateStr?: string | Date) {
  const now = new Date();
  
  let updatedDate = updatedDateStr ? new Date(updatedDateStr) : new Date();
  let nextUpdateDate: Date;

  if (nextUpdateDateStr) {
    nextUpdateDate = new Date(nextUpdateDateStr);
  } else {
    // 15 days default cycle
    nextUpdateDate = new Date(updatedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  }

  const diffTime = nextUpdateDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: 'active' | 'expiring_soon' | 'expired';
  let message = '';
  let badgeColor = '';

  if (daysRemaining <= 0) {
    status = 'expired';
    message = 'Please update mosque prayer timetable (সময়সূচি মেয়াদোত্তীর্ণ, হালনাগাদ আবশ্যক)';
    badgeColor = 'bg-rose-500/10 text-rose-700 border-rose-200';
  } else if (daysRemaining <= 3) {
    status = 'expiring_soon';
    message = `Timetable expiring in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} (শীঘ্রই হালনাগাদ প্রয়োজন)`;
    badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-200';
  } else {
    status = 'active';
    message = `Valid for next ${daysRemaining} days (হালনাগাদ সক্রিয়)`;
    badgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
  }

  return {
    status,
    daysRemaining,
    message,
    badgeColor,
    updatedDateFormatted: updatedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    nextUpdateDateFormatted: nextUpdateDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    isExpired: daysRemaining <= 0
  };
}
