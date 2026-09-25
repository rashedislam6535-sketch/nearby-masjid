const fs = require('fs');
const path = require('path');

const chartsDir = path.join(__dirname, '..', 'public', 'images', 'charts');
fs.mkdirSync(chartsDir, { recursive: true });

const charts = [
  {
    filename: 'baitul_mukarram_chart.svg',
    nameBn: 'বায়তুল মোকাররম জাতীয় মসজিদ',
    nameEn: 'Baitul Mukarram National Mosque',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:45 AM', jamat: '05:00 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '12:55 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:15 PM', jamat: '04:30 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:45 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'baitul_aman_chart.svg',
    nameBn: 'বায়তুল আমান জামে মসজিদ',
    nameEn: 'Baitul Aman Jame Masjid',
    dateRange: '০১ সেপ্টেম্বর - ১৫ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:10 PM', jamat: '04:25 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:07 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'noor_masjid_chart.svg',
    nameBn: 'নূর জামে মসজিদ (মিরপুর)',
    nameEn: 'Noor Jame Masjid',
    dateRange: '০১ সেপ্টেম্বর - ১৫ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:20 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:15 PM', jamat: '04:30 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:50 PM', jamat: '08:05 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'mirpur_central_chart.svg',
    nameBn: 'মিরপুর কেন্দ্রীয় জামে মসজিদ',
    nameEn: 'Mirpur Central Jame Masjid',
    dateRange: '০১ সেপ্টেম্বর - ১৫ সেপ্টেম্বর (হালনাগাদ আবশ্যক)',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:45 AM', jamat: '05:05 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:10 PM', jamat: '04:25 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:45 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'gulshan_society_chart.svg',
    nameBn: 'গুলশান সোসাইটি জামে মসজিদ',
    nameEn: 'Gulshan Society Jame Masjid',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:10 PM', jamat: '01:30 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:20 PM', jamat: '04:35 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:07 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '08:00 PM', jamat: '08:15 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'dhanmondi_chart.svg',
    nameBn: 'ধানমন্ডি শাহী ঈদগাহ জামে মসজিদ',
    nameEn: 'Dhanmondi Shahi Jame Masjid',
    dateRange: '০১ সেপ্টেম্বর - ১৫ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:45 AM', jamat: '05:05 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:10 PM', jamat: '04:25 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'uttara_sec7_chart.svg',
    nameBn: 'উত্তরা সেক্টর ৭ কেন্দ্রীয় জামে মসজিদ',
    nameEn: 'Uttara Sector 7 Central Jame Masjid',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:45 AM', jamat: '05:05 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:15 PM', jamat: '04:30 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:50 PM', jamat: '08:05 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'baitur_rauf_chart.svg',
    nameBn: 'বায়তুর রউফ জামে মসজিদ',
    nameEn: 'Baitur Rauf Jame Masjid',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:45 AM', jamat: '05:05 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:10 PM', jamat: '04:25 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:08 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'tara_masjid_chart.svg',
    nameBn: 'তারা মসজিদ (পুরান ঢাকা)',
    nameEn: 'Tara Masjid (Star Mosque)',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:05 PM', jamat: '04:20 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:07 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:45 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'shah_jalal_chart.svg',
    nameBn: 'হযরত শাহজালাল (রহঃ) দরগাহ মসজিদ',
    nameEn: 'Hazrat Shah Jalal Dargah Masjid',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:35 AM', jamat: '04:55 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '12:55 PM', jamat: '01:10 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:05 PM', jamat: '04:20 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:00 PM', jamat: '06:03 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:40 PM', jamat: '07:55 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:45 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'anderkilla_chart.svg',
    nameBn: 'আন্দরকিল্লা শাহী জামে মসজিদ',
    nameEn: 'Anderkilla Shahi Jame Masjid',
    dateRange: '০১ সেপ্টেম্বর - ১৫ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:40 AM', jamat: '05:00 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '12:55 PM', jamat: '01:10 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:05 PM', jamat: '04:20 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:00 PM', jamat: '06:03 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:40 PM', jamat: '07:55 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:45 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'shat_gombuj_chart.svg',
    nameBn: 'ষাট গম্বুজ মসজিদ',
    nameEn: 'Sixty Dome Mosque',
    dateRange: '১৬ সেপ্টেম্বর - ৩০ সেপ্টেম্বর',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:05 PM', jamat: '01:20 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:15 PM', jamat: '04:30 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:10 PM', jamat: '06:13 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:50 PM', jamat: '08:05 PM' },
      { waqtBn: 'জুমুআ', waqtEn: 'Jummah', azan: '12:50 PM', jamat: '01:30 PM' }
    ]
  },
  {
    filename: 'sample_ocr_chart.svg',
    nameBn: 'বাইতুল আমান জামে মসজিদ',
    nameEn: 'Sample Mosque Chart for OCR Testing',
    dateRange: 'চলতি সময়সূচি',
    times: [
      { waqtBn: 'ফজর', waqtEn: 'Fajr', azan: '04:50 AM', jamat: '05:10 AM' },
      { waqtBn: 'যোহর', waqtEn: 'Dhuhr', azan: '01:00 PM', jamat: '01:15 PM' },
      { waqtBn: 'আসর', waqtEn: 'Asr', azan: '04:10 PM', jamat: '04:25 PM' },
      { waqtBn: 'মাগরিব', waqtEn: 'Maghrib', azan: '06:05 PM', jamat: '06:10 PM' },
      { waqtBn: 'এশা', waqtEn: 'Isha', azan: '07:45 PM', jamat: '08:00 PM' }
    ]
  }
];

function generateSvg(item) {
  const rowHeight = 44;
  const startY = 160;
  
  const rows = item.times.map((t, i) => {
    const y = startY + i * rowHeight;
    const isEven = i % 2 === 0;
    const bgFill = isEven ? '#064e3b15' : '#ffffff';
    return `
      <rect x="25" y="${y}" width="550" height="38" rx="6" fill="${bgFill}" />
      <text x="45" y="${y + 24}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#064e3b">${t.waqtBn} / ${t.waqtEn}</text>
      <text x="260" y="${y + 24}" font-family="Arial, sans-serif" font-size="14" fill="#047857">${t.azan || '-'}</text>
      <text x="420" y="${y + 24}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#b45309">${t.jamat}</text>
    `;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="520" viewBox="0 0 600 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with Islamic aesthetic styling -->
  <rect width="600" height="520" rx="16" fill="#fdfbf7" stroke="#047857" stroke-width="4"/>
  <rect x="12" y="12" width="576" height="496" rx="12" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="6 3"/>

  <!-- Header Section -->
  <rect x="25" y="24" width="550" height="78" rx="10" fill="#064e3b"/>
  <text x="300" y="52" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="bold" fill="#fef3c7">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</text>
  <text x="300" y="78" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${item.nameBn}</text>
  <text x="300" y="94" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="11" fill="#cbd5e1">${item.nameEn}</text>

  <!-- Timetable Meta Info -->
  <rect x="25" y="112" width="550" height="34" rx="6" fill="#fef3c7" stroke="#fcd34d" stroke-width="1"/>
  <text x="45" y="134" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#92400e">নামাজের সময়সূচি (Prayer Timetable)</text>
  <text x="555" y="134" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#b45309">মেয়াদ: ${item.dateRange}</text>

  <!-- Table Column Headers -->
  <rect x="25" y="152" width="550" height="4" fill="#047857"/>
  <text x="45" y="176" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#4b5563">ওয়াক্ত (WAQT)</text>
  <text x="260" y="176" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#4b5563">আযান (AZAN)</text>
  <text x="420" y="176" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#064e3b">জামাত (JAMAT)</text>

  <!-- Rows -->
  ${rows}

  <!-- Footer Banner -->
  <line x1="25" y1="465" x2="575" y2="465" stroke="#d1d5db" stroke-width="1"/>
  <text x="300" y="488" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#064e3b" font-weight="bold">Nearby Masjid Platform • ডিজিটাল মসজিদ সময়সূচি ব্যবস্থাপনা</text>
</svg>`;
}

for (const chart of charts) {
  const filePath = path.join(chartsDir, chart.filename);
  fs.writeFileSync(filePath, generateSvg(chart), 'utf8');
}

console.log(`Generated ${charts.length} SVG timetable charts in ${chartsDir}`);
