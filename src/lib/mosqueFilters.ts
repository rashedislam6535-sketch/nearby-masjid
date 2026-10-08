import { MosqueData } from '../types/masjid';
import { calculateDistance } from './geoUtils';

export const VALID_DIVISIONS = [
  'All',
  'Dhaka',
  'Barisal',
  'Chittagong',
  'Sylhet',
  'Khulna',
  'Rajshahi',
  'Rangpur',
  'Mymensingh'
];

export const DIVISION_STORAGE_KEY = 'nearby_masjid_selected_division';

export function getValidDivision(value: string | null | undefined): string {
  if (!value) return 'All';
  const trimmed = value.trim();
  const match = VALID_DIVISIONS.find((d) => d.toLowerCase() === trimmed.toLowerCase());
  return match || 'All';
}

export interface FilterOptions {
  searchQuery?: string;
  selectedDivision?: string;
  maxDistanceMeters?: number | null;
  expiredOnly?: boolean;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

/**
 * Single, pure derived filtering and sorting function for mosques.
 * Covers: complete mosque dataset, case-insensitive trimmed search
 * (name, bn name, address, road, area, district, division, union),
 * division filter, distance radius filter, and expired status filter.
 */
export function filterAndSortMosques(
  mosques: MosqueData[],
  options: FilterOptions
): MosqueData[] {
  const {
    searchQuery = '',
    selectedDivision = 'All',
    maxDistanceMeters = null,
    expiredOnly = false,
    userLocation
  } = options;

  const trimmedQuery = searchQuery.trim().toLowerCase().normalize('NFC');
  const activeDivision = selectedDivision.trim();

  const filtered = mosques.filter((m) => {
    // 1. Division Filter
    if (activeDivision && activeDivision.toLowerCase() !== 'all') {
      const mDiv = (m.division || '').trim().toLowerCase();
      if (mDiv !== activeDivision.toLowerCase()) {
        return false;
      }
    }

    // 2. Expired Timetable Filter
    if (expiredOnly) {
      if (m.prayer?.validity_status !== 'expired') {
        return false;
      }
    }

    // 3. Search Query Filter (name, bn name, address, road, area, district, upazila, division, union)
    if (trimmedQuery) {
      const bnDivisionMap: Record<string, string> = {
        Barisal: 'বরিশাল',
        Dhaka: 'ঢাকা',
        Chittagong: 'চট্টগ্রাম',
        Sylhet: 'সিলেট',
        Khulna: 'খুলনা',
        Rajshahi: 'রাজশাহী',
        Rangpur: 'রংপুর',
        Mymensingh: 'ময়মনসিংহ'
      };

      const haystack = [
        m.mosque_name_en,
        m.mosque_name_bn,
        m.address,
        m.upazila,
        m.district,
        m.division,
        m.union_name,
        bnDivisionMap[m.division] || ''
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .normalize('NFC');

      const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
      const matchesAllTokens = tokens.every((tok) => haystack.includes(tok));
      if (!matchesAllTokens) {
        return false;
      }
    }

    // 4. Distance Radius Filter
    if (maxDistanceMeters !== null && maxDistanceMeters > 0) {
      let distMeters = m.distance_meters;
      if (distMeters === undefined && userLocation?.lat && userLocation?.lng) {
        distMeters = calculateDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude).meters;
      }
      if (distMeters !== undefined && distMeters > maxDistanceMeters) {
        return false;
      }
    }

    return true;
  });

  // Calculate distance & sort by proximity if userLocation is valid
  if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
    return filtered
      .map((m) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude);
        return {
          ...m,
          distance_meters: dist.meters,
          distance_text: dist.text
        };
      })
      .sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
  }

  return filtered;
}
