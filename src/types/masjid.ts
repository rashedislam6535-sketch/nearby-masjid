export interface MosqueData {
  id: number;
  mosque_name_bn: string;
  mosque_name_en: string;
  image: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  union_name: string | null;
  latitude: number;
  longitude: number;
  contact: string | null;
  created_at?: string;
  updated_at?: string;
  distance_meters?: number;
  distance_text?: string;
  prayer?: PrayerSchedule;
}

export interface PrayerSchedule {
  id?: number;
  mosque_id: number;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
  image?: string;
  updated_date?: string;
  next_update_date?: string;
  is_verified?: boolean;
  validity_status?: 'active' | 'expiring_soon' | 'expired';
  days_remaining?: number;
  ocr_raw_text?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  area_name: string;
  is_gps: boolean;
  error?: string;
}

export interface NextPrayerInfo {
  name: string;
  name_bn: string;
  time: string;
  formatted_time: string;
  remaining_minutes: number;
  remaining_seconds: number;
  countdown_text: string;
  is_running_now: boolean;
  status_banner: string;
}

export interface ExtractedOcrPrayerTimes {
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  jummah?: string;
  raw_text?: string;
  confidence?: number;
  notes?: string;
}

export interface DivisionArea {
  division: string;
  districts: {
    district: string;
    upazilas: string[];
  }[];
}
