import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Nearby Masjid — Mosque Finder & Prayer Timetable BD",
  description: "Find nearby mosques in Bangladesh by live GPS location and view verified prayer timetables, countdowns, and directions.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B3B2C"
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "Nearby Masjid Bangladesh",
                  "url": "https://nearby-masjid.vercel.app",
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
                  "name": "Nearby Masjid Platform",
                  "url": "https://nearby-masjid.vercel.app",
                  "logo": "https://nearby-masjid.vercel.app/icon.svg"
                }
              ]
            })
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
