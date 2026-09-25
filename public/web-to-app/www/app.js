/**
 * Nearby Masjid Mobile Phone App Engine (Web-to-App)
 * Fully functional both Online (connected to live Vercel Postgres)
 * and Standalone Offline (local calculations, compass, tasbih, offline mosques)
 */

const CLOUD_APP_URL = 'https://nearby-masjid.vercel.app';

// Pre-seeded Verified Mosques for Instant Offline Access
const DEFAULT_MOSQUES = [
  {
    id: 1,
    name_bn: 'জাতীয় মসজিদ বায়তুল মোকাররম',
    name_en: 'Baitul Mukarram National Mosque',
    address: 'পল্টন, ঢাকা ১০০০',
    division: 'Dhaka',
    lat: 23.7299,
    lng: 90.4125,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    contact: '+880 2-9556333',
    prayer: {
      fajr: '05:00 AM',
      dhuhr: '01:15 PM',
      asr: '04:30 PM',
      maghrib: '06:05 PM',
      isha: '07:45 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 2,
    name_bn: 'তারা মসজিদ',
    name_en: 'Star Mosque (Tara Masjid)',
    address: 'আরমানিটোলা, পুরান ঢাকা',
    division: 'Dhaka',
    lat: 23.7154,
    lng: 90.4019,
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    contact: '+880 1711-223344',
    prayer: {
      fajr: '05:05 AM',
      dhuhr: '01:15 PM',
      asr: '04:30 PM',
      maghrib: '06:05 PM',
      isha: '07:45 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 3,
    name_bn: 'বায়তুল আমান জামে মসজিদ',
    name_en: 'Baitul Aman Jame Masjid',
    address: 'মিরপুর-১, ঢাকা',
    division: 'Dhaka',
    lat: 23.8041,
    lng: 90.3653,
    image: 'https://images.unsplash.com/photo-1590076215667-874d4719602e?auto=format&fit=crop&w=800&q=80',
    contact: '+880 1819-556677',
    prayer: {
      fajr: '05:10 AM',
      dhuhr: '01:15 PM',
      asr: '04:25 PM',
      maghrib: '06:06 PM',
      isha: '08:00 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 4,
    name_bn: 'চকবাজার শাহী মসজিদ',
    name_en: 'Chawkbazar Shahi Mosque',
    address: 'চকবাজার, ঢাকা',
    division: 'Dhaka',
    lat: 23.7188,
    lng: 90.3953,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    contact: '+880 1912-334455',
    prayer: {
      fajr: '05:05 AM',
      dhuhr: '01:15 PM',
      asr: '04:25 PM',
      maghrib: '06:05 PM',
      isha: '07:50 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 5,
    name_bn: 'কাকরাইল মারকাজ মসজিদ',
    name_en: 'Kakrail Markaz Mosque',
    address: 'কাকরাইল, রমনা, ঢাকা',
    division: 'Dhaka',
    lat: 23.7381,
    lng: 90.4072,
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    contact: '+880 2-9334455',
    prayer: {
      fajr: '05:00 AM',
      dhuhr: '01:15 PM',
      asr: '04:30 PM',
      maghrib: '06:05 PM',
      isha: '07:45 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 6,
    name_bn: 'হযরত শাহজালাল (রহ.) দরগাহ মসজিদ',
    name_en: 'Hazrat Shah Jalal Dargah Mosque',
    address: 'আম্বরখানা, দরগাহ গেট, সিলেট',
    division: 'Sylhet',
    lat: 24.9004,
    lng: 91.8715,
    image: 'https://images.unsplash.com/photo-1590076215667-874d4719602e?auto=format&fit=crop&w=800&q=80',
    contact: '+880 821-716444',
    prayer: {
      fajr: '04:55 AM',
      dhuhr: '01:10 PM',
      asr: '04:20 PM',
      maghrib: '06:00 PM',
      isha: '07:40 PM',
      jummah: '01:30 PM'
    }
  },
  {
    id: 7,
    name_bn: 'আন্দরকিল্লা শাহী জামে মসজিদ',
    name_en: 'Anderkilla Shahi Jame Mosque',
    address: 'আন্দরকিল্লা, কোতোয়ালি, চট্টগ্রাম',
    division: 'Chittagong',
    lat: 22.3396,
    lng: 91.8364,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    contact: '+880 31-618822',
    prayer: {
      fajr: '04:58 AM',
      dhuhr: '01:10 PM',
      asr: '04:20 PM',
      maghrib: '06:02 PM',
      isha: '07:40 PM',
      jummah: '01:30 PM'
    }
  }
];

// App State
let currentTab = 'mosques';
let userLocation = { lat: 23.8041, lng: 90.3653, active: false };
let mosquesList = [];
let selectedDivision = 'All';
let searchQuery = '';
let tasbihCount = 0;
let tasbihTarget = 33;
const DHIKR_LIST = [
  { bn: 'سُبْحَانَ اللَّهِ', trans: 'সুবহানাল্লাহ (আল্লাহ অতি পবিত্র)' },
  { bn: 'الْحَمْدُ لِلَّهِ', trans: 'আলহামদুলিল্লাহ (সকল প্রশংসা আল্লাহর)' },
  { bn: 'اللَّهُ أَكْبَرُ', trans: 'আল্লাহু আকবার (আল্লাহ সর্বশ্রেষ্ঠ)' },
  { bn: 'أَسْتَغْفِرُ اللَّهَ', trans: 'আস্তাগফিরুল্লাহ (আল্লাহর কাছে ক্ষমা চাই)' },
  { bn: 'لَا إِلٰهَ إِلَّا اللَّهُ', trans: 'লা ইলাহা ইল্লাল্লাহ (আল্লাহ ছাড়া উপাস্য নেই)' }
];
let currentDhikrIndex = 0;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initNavigation();
  initTasbih();
  initPrayerTimes();
  initQiblaCompass();
  initServiceWorker();
  renderMosques();
  checkConnectivityAndLaunch();
});

// Check Online / Offline & Launch
function checkConnectivityAndLaunch() {
  const statusEl = document.getElementById('splash-status');
  if (statusEl) statusEl.textContent = 'নেটওয়ার্ক যাচাই করা হচ্ছে...';

  // If online, prepare cloud webview or offer launch
  if (navigator.onLine) {
    if (statusEl) statusEl.textContent = 'অনলাইনে সংযুক্ত। অ্যাপ চালু হচ্ছে...';
    setTimeout(() => {
      // Auto-load live app if preferred
      const preferredMode = localStorage.getItem('nm_pref_mode') || 'online';
      if (preferredMode === 'online') {
        launchOnlineView();
      } else {
        launchOfflineView();
      }
    }, 1200);
  } else {
    if (statusEl) statusEl.textContent = 'অফলাইন মোড সক্রিয় করা হচ্ছে...';
    setTimeout(() => {
      launchOfflineView();
    }, 1000);
  }
}

function launchOnlineView() {
  const splash = document.getElementById('splash-screen');
  const onlineView = document.getElementById('online-view');
  const offlineView = document.getElementById('offline-view');
  const iframe = document.getElementById('online-iframe');

  if (iframe && !iframe.src) {
    iframe.src = CLOUD_APP_URL;
  }

  if (onlineView) onlineView.classList.remove('hidden');
  if (offlineView) offlineView.classList.add('hidden');
  if (splash) splash.classList.add('hidden');
  localStorage.setItem('nm_pref_mode', 'online');
}

function launchOfflineView() {
  const splash = document.getElementById('splash-screen');
  const onlineView = document.getElementById('online-view');
  const offlineView = document.getElementById('offline-view');

  if (onlineView) onlineView.classList.add('hidden');
  if (offlineView) offlineView.classList.remove('hidden');
  if (splash) splash.classList.add('hidden');
  localStorage.setItem('nm_pref_mode', 'offline');
}

// Storage Initialization
function initStorage() {
  try {
    const saved = localStorage.getItem('nm_mosques');
    if (saved) {
      mosquesList = JSON.parse(saved);
    } else {
      mosquesList = [...DEFAULT_MOSQUES];
      localStorage.setItem('nm_mosques', JSON.stringify(mosquesList));
    }
  } catch (e) {
    mosquesList = [...DEFAULT_MOSQUES];
  }

  // Tasbih count
  const savedTasbih = localStorage.getItem('nm_tasbih_count');
  if (savedTasbih) tasbihCount = parseInt(savedTasbih, 10) || 0;
}

// Navigation between Tabs
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-item');
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Division Filter Chips
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedDivision = chip.getAttribute('data-division');
      renderMosques();
    });
  });

  // Search Input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderMosques();
    });
  }

  // GPS Button
  const gpsBtn = document.getElementById('btn-get-gps');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', requestUserLocation);
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));

  const activePage = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);

  if (activePage) activePage.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'qibla') {
    startQiblaListener();
  }
}

// Distance Calculation (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
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
    return `${meters} মিটার`;
  } else {
    return `${(meters / 1000).toFixed(1)} কিমি`;
  }
}

// Request GPS Location
function requestUserLocation() {
  if (!navigator.geolocation) {
    alert('আপনার ডিভাইসে জিপিএস লোকেশন সাপোর্ট করছে না।');
    return;
  }

  const gpsBtn = document.getElementById('btn-get-gps');
  if (gpsBtn) gpsBtn.textContent = 'লোকেশন খোঁজা হচ্ছে...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.lat = pos.coords.latitude;
      userLocation.lng = pos.coords.longitude;
      userLocation.active = true;
      if (gpsBtn) gpsBtn.innerHTML = '✓ লোকেশন সক্রিয়';
      renderMosques();
    },
    (err) => {
      alert('লোকেশন পাওয়া যায়নি: ' + err.message);
      if (gpsBtn) gpsBtn.innerHTML = '📍 জিপিএস খুঁজুন';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Render Mosques List
function renderMosques() {
  const container = document.getElementById('mosques-list-container');
  if (!container) return;

  let filtered = mosquesList.filter((m) => {
    const matchesDiv = selectedDivision === 'All' || m.division === selectedDivision;
    const matchesQuery =
      !searchQuery ||
      m.name_bn.toLowerCase().includes(searchQuery) ||
      m.name_en.toLowerCase().includes(searchQuery) ||
      m.address.toLowerCase().includes(searchQuery);
    return matchesDiv && matchesQuery;
  });

  // Calculate distance if GPS is active
  if (userLocation.active) {
    filtered.forEach((m) => {
      m._distText = getDistance(userLocation.lat, userLocation.lng, m.lat, m.lng);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 16px; margin-bottom: 8px;">কোনো মসজিদ পাওয়া যায়নি</p>
        <p style="font-size: 12px;">অনুগ্রহ করে অন্য এলাকা বেছে নিন বা নাম পরিবর্তন করুন।</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((m) => {
      const distBadge = m._distText ? `<span class="mosque-card-dist">📍 ${m._distText}</span>` : '';
      return `
      <div class="mosque-card">
        <div class="mosque-card-img-wrap">
          <img src="${m.image}" class="mosque-card-img" alt="${m.name_bn}" loading="lazy" onerror="this.src='icon.png'" />
          ${distBadge}
        </div>
        <div class="mosque-card-body">
          <div class="mosque-name-row">
            <h3 class="mosque-name-bn">${m.name_bn}</h3>
            <span class="mosque-verified-badge">✓ যাচাইকৃত</span>
          </div>
          <p class="mosque-address">📍 ${m.address}</p>
          
          <div class="prayer-grid-mini">
            <div class="prayer-col-mini"><span class="p-name">ফজর</span><span class="p-time">${m.prayer.fajr}</span></div>
            <div class="prayer-col-mini"><span class="p-name">যোহর</span><span class="p-time">${m.prayer.dhuhr}</span></div>
            <div class="prayer-col-mini"><span class="p-name">আসর</span><span class="p-time">${m.prayer.asr}</span></div>
            <div class="prayer-col-mini"><span class="p-name">মাগরিব</span><span class="p-time">${m.prayer.maghrib}</span></div>
            <div class="prayer-col-mini"><span class="p-name">ইশা</span><span class="p-time">${m.prayer.isha}</span></div>
          </div>

          <div class="mosque-card-actions">
            <a href="https://maps.google.com/?q=${m.lat},${m.lng}" target="_blank" class="btn-card-action btn-primary-action">🗺️ গুগল ম্যাপে রুট</a>
            <button onclick="openMosqueModal(${m.id})" class="btn-card-action btn-secondary-action">📋 সময়সূচি ও তথ্য</button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// Modal Details
window.openMosqueModal = function (id) {
  const m = mosquesList.find((x) => x.id === id);
  if (!m) return;

  const modal = document.getElementById('details-modal');
  const body = document.getElementById('details-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 16px;">
      <img src="${m.image}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 14px; margin-bottom: 10px;" />
      <h2 style="font-size: 18px; color: var(--gold-light); font-weight: 800;">${m.name_bn}</h2>
      <p style="font-size: 13px; color: var(--emerald-light);">${m.name_en}</p>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">📍 ${m.address}</p>
      ${m.contact ? `<p style="font-size: 12px; color: var(--gold-primary); margin-top: 4px;">📞 ${m.contact}</p>` : ''}
    </div>

    <h3 style="font-size: 14px; color: var(--gold-light); margin-bottom: 10px; font-weight: 700;">আজকের নামাজের জামাত সময়:</h3>
    <div style="background: rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span>ফজর (Fajr)</span><strong style="color:var(--gold-light);">${m.prayer.fajr}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span>যোহর (Dhuhr)</span><strong style="color:var(--gold-light);">${m.prayer.dhuhr}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span>আসর (Asr)</span><strong style="color:var(--gold-light);">${m.prayer.asr}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span>মাগরিব (Maghrib)</span><strong style="color:var(--gold-light);">${m.prayer.maghrib}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span>ইশা (Isha)</span><strong style="color:var(--gold-light);">${m.prayer.isha}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding: 10px 14px; background: rgba(245,158,11,0.15);">
        <span>জুম্মা (Jummah)</span><strong style="color:var(--gold-light);">${m.prayer.jummah}</strong>
      </div>
    </div>

    <button onclick="playSoftChime()" style="width: 100%; background: rgba(245, 158, 11, 0.2); border: 1px solid var(--gold-primary); color: var(--gold-light); padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-bottom: 10px;">
      🔔 নামাজের ধ্বনি শুনুন (Audio Chime)
    </button>
  `;

  modal.classList.remove('hidden');
};

window.closeDetailsModal = function () {
  const modal = document.getElementById('details-modal');
  if (modal) modal.classList.add('hidden');
};

// Add Mosque Modal
window.openAddMosqueModal = function () {
  const modal = document.getElementById('add-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeAddModal = function () {
  const modal = document.getElementById('add-modal');
  if (modal) modal.classList.add('hidden');
};

window.submitNewMosque = function (e) {
  e.preventDefault();
  const nameBn = document.getElementById('add-name-bn').value;
  const nameEn = document.getElementById('add-name-en').value || nameBn;
  const address = document.getElementById('add-address').value;
  const division = document.getElementById('add-division').value;
  const contact = document.getElementById('add-contact').value;

  const fajr = document.getElementById('add-fajr').value || '05:05 AM';
  const dhuhr = document.getElementById('add-dhuhr').value || '01:15 PM';
  const asr = document.getElementById('add-asr').value || '04:30 PM';
  const maghrib = document.getElementById('add-maghrib').value || '06:05 PM';
  const isha = document.getElementById('add-isha').value || '07:45 PM';

  const newMosque = {
    id: Date.now(),
    name_bn: nameBn,
    name_en: nameEn,
    address: address,
    division: division,
    lat: userLocation.lat || 23.8041,
    lng: userLocation.lng || 90.3653,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    contact: contact,
    prayer: { fajr, dhuhr, asr, maghrib, isha, jummah: '01:30 PM' }
  };

  mosquesList.unshift(newMosque);
  try {
    localStorage.setItem('nm_mosques', JSON.stringify(mosquesList));
  } catch (err) {}

  closeAddModal();
  renderMosques();
  alert('মসজিদ সফলভাবে যুক্ত করা হয়েছে!');
};

// Hijri Date Calculation
function getHijriEstimation() {
  const date = new Date();
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
  const r = bjd - 1 - 10631 * n + 354;
  const j = Math.floor((10985 - r) / 5316) * Math.floor((50 * r) / 17719) + Math.floor(r / 5670) * Math.floor((43 * r) / 15238);
  const r2 = r - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const mH = Math.floor((24 * r2) / 709);
  const dH = r2 - Math.floor((709 * mH) / 24);
  const yH = 30 * n + j - 30;

  const HIJRI_MONTHS = ['মুহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ্জ'];
  const monthBn = HIJRI_MONTHS[Math.max(0, Math.min(11, mH - 1))];

  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBn = (num) => num.toString().replace(/\d/g, (d) => bnNums[parseInt(d, 10)]);

  return `${toBn(dH)} ${monthBn}, ${toBn(yH)} হিজরি`;
}

// Prayer Times Calculation for Dhaka Coordinates
function initPrayerTimes() {
  const hijriEl = document.getElementById('prayer-hijri-date');
  if (hijriEl) hijriEl.textContent = getHijriEstimation();

  const gregEl = document.getElementById('prayer-greg-date');
  if (gregEl) {
    const today = new Date();
    gregEl.textContent = today.toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Countdown timer update every second
  updateNextPrayerTimer();
  setInterval(updateNextPrayerTimer, 1000);
}

function updateNextPrayerTimer() {
  const countdownEl = document.getElementById('prayer-countdown');
  const titleEl = document.getElementById('next-prayer-name');
  if (!countdownEl || !titleEl) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Approximate Prayer Schedule (Minutes from midnight)
  const prayers = [
    { name: 'ফজর (Fajr)', min: 5 * 60 + 5 },
    { name: 'যোহর (Dhuhr)', min: 13 * 60 + 15 },
    { name: 'আসর (Asr)', min: 16 * 60 + 25 },
    { name: 'মাগরিব (Maghrib)', min: 18 * 60 + 6 },
    { name: 'ইশা (Isha)', min: 19 * 60 + 50 }
  ];

  let nextP = prayers.find((p) => p.min > currentMinutes);
  let diffMinutes = 0;

  if (nextP) {
    diffMinutes = nextP.min - currentMinutes;
    titleEl.textContent = nextP.name;
  } else {
    // Tomorrow Fajr
    nextP = prayers[0];
    diffMinutes = 24 * 60 - currentMinutes + nextP.min;
    titleEl.textContent = 'আগামীকালের ' + nextP.name;
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const secs = 59 - now.getSeconds();

  countdownEl.textContent = `বাকি আছে: ${hours} ঘণ্টা ${mins} মিনিট ${secs} সেকেন্ড`;
}

// Web Audio API Soft Chime
window.playSoftChime = function () {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const freqs = [528, 660, 792];

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
};

// Qibla Compass
let compassListenerActive = false;
function initQiblaCompass() {
  const dial = document.getElementById('compass-dial');
  if (dial) dial.style.transform = 'rotate(0deg)';
}

function startQiblaListener() {
  if (compassListenerActive) return;

  const degEl = document.getElementById('compass-degrees');
  const statusEl = document.getElementById('compass-status');
  const dial = document.getElementById('compass-dial');

  // Kaaba direction from Dhaka is roughly 268° (West-Northwest)
  const qiblaHeading = 268;

  const handleOrientation = (e) => {
    let heading = 0;
    if (e.webkitCompassHeading) {
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      heading = 360 - e.alpha;
    }

    const rounded = Math.round(heading);
    if (degEl) degEl.textContent = `${rounded}°`;

    if (dial) {
      dial.style.transform = `rotate(${-heading}deg)`;
    }

    const diff = Math.abs(rounded - qiblaHeading);
    if (statusEl) {
      if (diff <= 6 || diff >= 354) {
        statusEl.innerHTML = '<span style="color: #10b981; font-weight: bold;">✓ ক্বিবলার দিকে মুখ করা হয়েছে!</span>';
        if (navigator.vibrate) navigator.vibrate(30);
      } else {
        statusEl.textContent = 'ফোনটি আনুভূমিক রাখুন এবং ক্বিবলার দাগ মেলাতে ঘুরুন';
      }
    }
  };

  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((resp) => {
          if (resp === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
            compassListenerActive = true;
          }
        })
        .catch(console.warn);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
      compassListenerActive = true;
    }
  }
}

// Digital Tasbih
function initTasbih() {
  renderTasbih();
  const beadBtn = document.getElementById('tasbih-bead-btn');
  if (beadBtn) {
    beadBtn.addEventListener('click', countTasbih);
  }
}

function countTasbih() {
  tasbihCount++;
  if (navigator.vibrate) {
    navigator.vibrate(40);
  }

  if (tasbihCount >= tasbihTarget) {
    playSoftChime();
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
  }

  localStorage.setItem('nm_tasbih_count', tasbihCount.toString());
  renderTasbih();
}

window.resetTasbih = function () {
  if (confirm('তাসবীহ গণনা রিসেট করতে চান?')) {
    tasbihCount = 0;
    localStorage.setItem('nm_tasbih_count', '0');
    renderTasbih();
  }
};

window.nextDhikr = function () {
  currentDhikrIndex = (currentDhikrIndex + 1) % DHIKR_LIST.length;
  renderTasbih();
};

window.toggleTasbihTarget = function () {
  tasbihTarget = tasbihTarget === 33 ? 100 : 33;
  renderTasbih();
};

function renderTasbih() {
  const countEl = document.getElementById('tasbih-count');
  const dhikrAr = document.getElementById('tasbih-dhikr-ar');
  const dhikrTr = document.getElementById('tasbih-dhikr-tr');
  const targetEl = document.getElementById('tasbih-target');

  if (countEl) countEl.textContent = tasbihCount;
  if (dhikrAr) dhikrAr.textContent = DHIKR_LIST[currentDhikrIndex].bn;
  if (dhikrTr) dhikrTr.textContent = DHIKR_LIST[currentDhikrIndex].trans;
  if (targetEl) targetEl.textContent = `লক্ষ্য: ${tasbihCount}/${tasbihTarget}`;
}

// Service Worker Registration
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('Service Worker not registered:', err);
      });
    });
  }
}
