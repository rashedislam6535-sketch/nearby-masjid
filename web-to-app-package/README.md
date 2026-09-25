# Nearby Masjid — Mobile Phone Web-to-App Package (কাছের মসজিদ)

This ZIP package is specially structured for **Web-to-App phone converters** to generate an Android APK / AAB or iOS mobile application.

---

## 📱 What is in this Package?

- `index.html`: The core mobile application entry point.
- `app.css`: Native mobile app stylesheet with luxury emerald & gold Islamic dark theme, safe-area-inset padding for iPhone Dynamic Island and Android navigation bars.
- `app.js`: High-performance mobile engine containing:
  - Dual-mode architecture (Seamless Live Cloud app via Vercel + Standalone Offline mode).
  - Real-time GPS distance calculation to nearest mosques in Bangladesh.
  - Mathematical prayer timetable calculations (Fajr, Dhuhr, Asr, Maghrib, Isha).
  - Real-time Hijri date estimation.
  - Interactive Qibla Compass using device orientation sensor (`DeviceOrientationEvent`).
  - Digital Tasbih with haptic phone vibration (`navigator.vibrate`).
  - Pre-seeded verified Bangladesh mosques + offline mosque submission stored in `localStorage`.
  - Built-in Islamic audio chime using Web Audio API (no external MP3 download required).
- `logo.png` & `icon.png`: 1024x1024 3D luxury app logo icon.
- `icon.svg`: Vector icon.
- `manifest.json`: Web App Manifest for mobile PWA standalone mode.
- `sw.js`: Service worker for 100% offline caching.
- `config.xml`: Pre-configured for Apache Cordova, PhoneGap, and VoltBuilder.
- `capacitor.config.json`: Pre-configured for Ionic / Capacitor app compilation.
- `www/`: Full mirror subfolder for tools that look inside `www/`.

---

## 🛠️ How to Convert this to a Mobile Phone App (APK / iOS)

### Method 1: Website 2 APK Builder (Recommended & Easiest for Windows PC)
1. Open **Website 2 APK Builder**.
2. Select **"Local Website Folder"** or **"HTML5 App"**.
3. Choose the extracted folder or select `index.html`.
4. Set App Title: `Nearby Masjid` (or `কাছের মসজিদ`).
5. Select `logo.png` as the App Icon.
6. Enable Permissions: **Location (GPS)**, **Internet**, **Access Network State**, **Vibrate**.
7. Click **"Build APK"** to get your `.apk` ready for any Android phone.

### Method 2: Web-to-App Online Services (WebToApp.design, AppyPie, AppsGeyser)
1. Go to your preferred web-to-app builder site.
2. Select **"Upload ZIP / HTML5 Web App"**.
3. Upload `nearby-masjid-web-to-app.zip`.
4. It will automatically detect `index.html` and `manifest.json`.
5. Download your compiled Android APK!

### Method 3: Apache Cordova / PhoneGap / VoltBuilder
```bash
npm install -g cordova
cordova create nearby-masjid com.nearbymasjid.app "Nearby Masjid"
# Copy all files into www/
cordova platform add android
cordova build android
```

### Method 4: Ionic / Capacitor
```bash
npm install -g @capacitor/cli @capacitor/core
npx cap init "Nearby Masjid" com.nearbymasjid.app --web-dir www
npx cap add android
npx cap open android
```

---

## 🌐 Live Cloud Version
The app is also live at:
[https://nearby-masjid.vercel.app](https://nearby-masjid.vercel.app)
