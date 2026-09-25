/**
 * Geographic utilities for Nearby Masjid
 * Real Haversine distance calculation and Bangladesh geographic hierarchy
 */

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { meters: number; text: string } {
  const R = 6371e3; // Earth's radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = Math.round(R * c);

  if (meters < 1000) {
    return { meters, text: `${meters} meter` };
  } else {
    const km = (meters / 1000).toFixed(1);
    return { meters, text: `${km} km` };
  }
}

export interface BDLocationPreset {
  name: string;
  nameBn: string;
  division: string;
  district: string;
  area: string;
  lat: number;
  lng: number;
}

export const BD_LOCATION_PRESETS: BDLocationPreset[] = [
  {
    name: 'Mirpur, Dhaka',
    nameBn: 'মিরপুর, ঢাকা',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Mirpur Area',
    lat: 23.8041,
    lng: 90.3653
  },
  {
    name: 'Paltan / Motijheel, Dhaka',
    nameBn: 'পল্টন / মতিঝিল, ঢাকা',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Paltan & Motijheel',
    lat: 23.7299,
    lng: 90.4125
  },
  {
    name: 'Gulshan / Banani, Dhaka',
    nameBn: 'গুলশান / বনানী, ঢাকা',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Gulshan Area',
    lat: 23.7925,
    lng: 90.4078
  },
  {
    name: 'Dhanmondi, Dhaka',
    nameBn: 'ধানমন্ডি, ঢাকা',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Dhanmondi Area',
    lat: 23.7461,
    lng: 90.3742
  },
  {
    name: 'Uttara, Dhaka',
    nameBn: 'উত্তরা, ঢাকা',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Uttara Sector Area',
    lat: 23.8728,
    lng: 90.3957
  },
  {
    name: 'Kotwali, Chittagong',
    nameBn: 'কোতোয়ালি, চট্টগ্রাম',
    division: 'Chittagong',
    district: 'Chittagong',
    area: 'Anderkilla / Kotwali',
    lat: 22.3396,
    lng: 91.8364
  },
  {
    name: 'Amberkhana, Sylhet',
    nameBn: 'আম্বরখানা, সিলেট',
    division: 'Sylhet',
    district: 'Sylhet',
    area: 'Dargah Mahalla / Sadar',
    lat: 24.9008,
    lng: 91.8718
  },
  {
    name: 'Bagerhat Sadar, Khulna',
    nameBn: 'বাগেরহাট সদর, খুলনা',
    division: 'Khulna',
    district: 'Bagerhat',
    area: 'Shat Gombuj Area',
    lat: 22.6744,
    lng: 89.7417
  },
  {
    name: 'Barisal Sadar, Barisal',
    nameBn: 'বরিশাল সদর, বরিশাল',
    division: 'Barisal',
    district: 'Barisal',
    area: 'Sadar Road & Collectorate',
    lat: 22.7010,
    lng: 90.3535
  },
  {
    name: 'Guthia, Barisal',
    nameBn: 'গুঠিয়া, উজিরপুর, বরিশাল',
    division: 'Barisal',
    district: 'Barisal',
    area: 'Guthia Baitul Aman Complex',
    lat: 22.7981,
    lng: 90.2642
  }
];

export const BANGLADESH_DIVISIONS: Record<string, Record<string, string[]>> = {
  Dhaka: {
    Dhaka: ['Mirpur', 'Paltan', 'Gulshan', 'Dhanmondi', 'Uttara', 'Mohammadpur', 'Kotwali', 'Dakshinkhan', 'Tejgaon', 'Badda'],
    Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
    Narayanganj: ['Narayanganj Sadar', 'Bandar', 'Rupganj', 'Sonargaon', 'Araihazar']
  },
  Barisal: {
    Barisal: ['Barisal Sadar', 'Wazirpur', 'Gournadi', 'Bakerganj', 'Babuganj', 'Banaripara', 'Muladi', 'Mehendiganj', 'Agailjhara', 'Hizla'],
    Patuakhali: ['Patuakhali Sadar', 'Kuakata', 'Galachipa', 'Bauphal', 'Kalapara'],
    Bhola: ['Bhola Sadar', 'Char Fasson', 'Borhanuddin', 'Lalmohan'],
    Jhalokati: ['Jhalokati Sadar', 'Nalchity', 'Rajapur', 'Kathalia'],
    Pirojpur: ['Pirojpur Sadar', 'Mathbaria', 'Bhandaria', 'Nazirpur'],
    Barguna: ['Barguna Sadar', 'Amtali', 'Patharghata', 'Betagi']
  },
  Chittagong: {
    Chittagong: ['Kotwali', 'Panchlaish', 'Double Mooring', 'Halishahar', 'Pahartali', 'Hathazari'],
    CoxsBazar: ['Coxs Bazar Sadar', 'Teknaf', 'Ukhiya', 'Chakaria', 'Ramu']
  },
  Sylhet: {
    Sylhet: ['Sylhet Sadar', 'Golapganj', 'Beanibazar', 'Zakiganj', 'Kanaighat'],
    Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Rajnagar']
  },
  Khulna: {
    Khulna: ['Khulna Sadar', 'Daulatpur', 'Khalishpur', 'Sonadanga', 'Rupsha'],
    Bagerhat: ['Bagerhat Sadar', 'Fakirhat', 'Mollahat', 'Rampal', 'Mongla']
  },
  Rajshahi: {
    Rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Bagha', 'Paba'],
    Bogra: ['Bogra Sadar', 'Sherpur', 'Shibganj', 'Gabtali']
  }
};
