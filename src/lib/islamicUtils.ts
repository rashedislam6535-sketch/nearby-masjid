/**
 * Islamic utilities: Hijri calendar estimation, prayer wisdom reflections,
 * and Web Audio API soft prayer chime
 */

export interface HijriDateInfo {
  day: number;
  monthBn: string;
  monthEn: string;
  year: number;
  formattedBn: string;
  formattedEn: string;
}

export const HIJRI_MONTHS = [
  { bn: 'মুহররম', en: 'Muharram' },
  { bn: 'সফর', en: 'Safar' },
  { bn: 'রবিউল আউয়াল', en: 'Rabi al-Awwal' },
  { bn: 'রবিউস সানি', en: 'Rabi al-Thani' },
  { bn: 'জমাদিউল আউয়াল', en: 'Jumada al-Awwal' },
  { bn: 'জমাদিউস সানি', en: 'Jumada al-Thani' },
  { bn: 'রজব', en: 'Rajab' },
  { bn: 'শাবান', en: 'Sha’ban' },
  { bn: 'রমজান', en: 'Ramadan' },
  { bn: 'শাওয়াল', en: 'Shawwal' },
  { bn: 'জিলকদ', en: 'Dhu al-Qi’dah' },
  { bn: 'জিলহজ্জ', en: 'Dhu al-Hijjah' }
];

const BN_NUMS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBnNumber(n: number | string): string {
  return n.toString().replace(/\d/g, (d) => BN_NUMS[parseInt(d, 10)]);
}

/**
 * Approximate Kuwaiti / Umm al-Qura algorithm for Hijri date calculation
 */
export function getHijriDate(date: Date = new Date()): HijriDateInfo {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

  const bjd = jd - 1948440 + 10632;
  const n = Math.floor((bjd - 1) / 10631);
  const r = (bjd - 1) - 10631 * n + 354;
  const j = (Math.floor((10985 - r) / 5316)) * (Math.floor((50 * r) / 17719)) + (Math.floor(r / 5670)) * (Math.floor((43 * r) / 15238));
  const r2 = r - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  const mH = Math.floor((24 * r2) / 709);
  const dH = r2 - Math.floor((709 * mH) / 24);
  const yH = 30 * n + j - 30;

  const monthIdx = Math.max(0, Math.min(11, mH - 1));
  const monthBn = HIJRI_MONTHS[monthIdx].bn;
  const monthEn = HIJRI_MONTHS[monthIdx].en;

  return {
    day: dH,
    monthBn,
    monthEn,
    year: yH,
    formattedBn: `${toBnNumber(dH)} ${monthBn}, ${toBnNumber(yH)} হিজরি`,
    formattedEn: `${dH} ${monthEn} ${yH} AH`
  };
}

export interface PrayerWisdom {
  verseBn: string;
  verseEn: string;
  sourceBn: string;
  sourceEn: string;
}

export const PRAYER_WISDOMS: PrayerWisdom[] = [
  {
    verseBn: 'নিশ্চয়ই নামাজ মুমিনদের ওপর নির্দিষ্ট সময়ে আবশ্যক করা হয়েছে।',
    verseEn: 'Indeed, prayer has been decreed upon the believers at specified times.',
    sourceBn: 'সূরা আন-নিসা: ১০৩',
    sourceEn: 'Surah An-Nisa 4:103'
  },
  {
    verseBn: 'তোমরা নামাজের প্রতি যত্নবান হও, বিশেষ করে মধ্যবর্তী নামাজের প্রতি।',
    verseEn: 'Maintain with care the obligatory prayers and in particular the middle prayer.',
    sourceBn: 'সূরা আল-বাকারা: ২৩৮',
    sourceEn: 'Surah Al-Baqarah 2:238'
  },
  {
    verseBn: 'নিশ্চয়ই নামাজ অন্যায় ও অশ্লীল কাজ থেকে বিরত রাখে।',
    verseEn: 'Indeed, prayer prohibits immorality and wrongdoing.',
    sourceBn: 'সূরা আল-আনকাবুত: ৪৫',
    sourceEn: 'Surah Al-Ankabut 29:45'
  },
  {
    verseBn: 'রাসূলুল্লাহ (সা.) বলেছেন: মানুষের আমলের মধ্যে সর্বপ্রথম নামাজের হিসাব নেওয়া হবে।',
    verseEn: 'The Prophet (ﷺ) said: The first matter for which one will be questioned on Judgment Day is prayer.',
    sourceBn: 'সুনান আত-তিরমিজি',
    sourceEn: 'Sunan At-Tirmidhi'
  },
  {
    verseBn: 'ধৈর্য ও নামাজের মাধ্যমে তোমরা আল্লাহর সাহায্য প্রার্থনা কর।',
    verseEn: 'Seek help through patience and prayer.',
    sourceBn: 'সূরা আল-বাকারা: ৪৫',
    sourceEn: 'Surah Al-Baqarah 2:45'
  }
];

export function getDailyWisdom(): PrayerWisdom {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return PRAYER_WISDOMS[dayOfYear % PRAYER_WISDOMS.length];
}

/**
 * Play a peaceful Islamic chime using Web Audio API (Synthesized Bell/Gong)
 * Safe and works on all browsers without external audio asset downloads
 */
export function playSoftChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Harmonic frequencies for gentle meditative chime
    const freqs = [528, 660, 792]; // Solfeggio / serene chords
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + 3.0);
    });
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}
