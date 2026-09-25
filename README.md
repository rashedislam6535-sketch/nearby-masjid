# 🕌 Nearby Masjid — Bangladesh

> A modern, production-ready mosque finder and prayer timetable management application built for Bangladesh with real GPS location detection, live prayer countdown, uploaded timetable image viewer, and AI OCR assistance.

![Nearby Masjid Preview](/public/images/charts/baitul_aman_chart.svg)

---

## 🌟 Key Features

### 1. 📍 Location-Based Mosque Finder
- **Live GPS Detection**: Real-time geolocation detection using HTML5 Geolocation API with manual area fallback (Mirpur, Paltan, Gulshan, Dhanmondi, Uttara, Chittagong, Sylhet, Khulna).
- **Accurate Proximity**: Accurate distance calculation using the Haversine formula (`300 meter`, `500 meter`, `1.2 km`).
- **Real Database & Verified Mosques**: Seeded with real, authentic Bangladeshi mosques with exact coordinates, administrative divisions (Division, District, Upazila, Union/Ward), cover photos, and phone numbers.

### 2. ⏳ Real-Time Prayer Time Tracking
- **Bangladesh Standard Time (BST)**: Real-time synchronized clock.
- **Dynamic Jamat Calculations**: Automatically tracks current and upcoming prayers with down-to-the-second countdowns.
- **Live Jamat Alerts**: Prominently displays **"Asr prayer time started (আসর জামাত চলছে)"** when prayer time begins.

### 3. 🗓️ 15-Day Timetable Validity & Update Cycle
- Mosque prayer times change every 15 days in Bangladesh.
- Every timetable includes an active validity window (e.g. `01 September - 15 September`).
- Automated notification banner: **"⚠️ Please update mosque prayer timetable (সময়সূচি মেয়াদোত্তীর্ণ, হালনাগাদ আবশ্যক)"** when 15 days expire.

### 4. 🤖 AI OCR Image Reading & Admin Management
- **OCR Assistance**: Automatically reads uploaded prayer timetable charts (Bengali & English numerals and waqt names).
- **Verification Safeguard**: Strict human-in-the-loop policy — AI only assists reading images; admin verifies before saving.
- **Mosque Management**: Admin portal to register new mosques, edit prayer schedules, replace chart images, and monitor validity status.

### 5. 🗺️ Interactive Maps
- Built with **Leaflet** and **OpenStreetMap**.
- Custom Islamic minaret markers with distance badges and one-click navigation to **Google Maps**.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) & React 19
- **Database**: PostgreSQL 17 (Supabase Pooler)
- **Maps**: Leaflet & OpenStreetMap + Google Maps Navigation
- **OCR Engine**: Tesseract.js & Vision-based Bengali/English numeral parser
- **Styling**: Tailwind CSS (Islamic Emerald Green, White, and Gold theme)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/rashedislam6535-sketch/nearby-masjid.git
cd nearby-masjid
npm install
```

### 2. Configure Environment Variables
Create a `.env` file with your PostgreSQL connection:
```env
DATABASE_URL="postgresql://postgres:...@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
PGSSLMODE="require"
```

### 3. Initialize & Seed Database
```bash
node scripts/init-masjid-db.js
node scripts/generate-charts.js
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
MIT License. Built for the Muslim community of Bangladesh.
