import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const APP_URL = "https://nearby-masjid.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Nearby Masjid — Mosque Finder & Prayer Timetable BD",
    template: "%s | Nearby Masjid BD"
  },
  description: "Find nearby mosques in Bangladesh with live GPS coordinates, distance calculation, verified 15-day prayer timetables, down-to-the-second jamat countdowns, and Qibla compass directions.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Nearby Masjid — Mosque Finder & Prayer Timetable BD",
    description: "Locate nearby verified mosques across all 8 divisions in Bangladesh. Real GPS distance, authentic prayer times, and Qibla compass.",
    url: APP_URL,
    siteName: "Nearby Masjid Bangladesh",
    locale: "en_BD",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Nearby Masjid Bangladesh"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearby Masjid — Mosque Finder & Prayer Timetable BD",
    description: "Locate nearby verified mosques across all 8 divisions in Bangladesh. Real GPS distance, authentic prayer times, and Qibla compass.",
    images: ["/logo.png"]
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nearby Masjid"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B3B2C"
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#app`,
      "name": "Nearby Masjid Bangladesh",
      "url": APP_URL,
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "description": "Find nearby mosques in Bangladesh by GPS and view verified prayer timetables, countdowns, and directions.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BDT"
      }
    },
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#org`,
      "name": "Nearby Masjid Platform",
      "url": APP_URL,
      "logo": `${APP_URL}/icon.svg`
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Anti-flash theme script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nearby_masjid_theme')||'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.add(t);}catch(e){}})();`,
          }}
        />
        {/* Single canonical JSON-LD Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdGraph)
          }}
        />
      </head>
      <body className="bg-[var(--bg-page)] text-[var(--text-primary)] min-h-screen selection:bg-amber-400 selection:text-emerald-950 font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
