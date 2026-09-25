import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nearby Masjid — Mosque Finder & Prayer Timetable BD",
  description: "Find nearby mosques in Bangladesh by live GPS location and view verified prayer timetables, countdowns, and directions.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
  themeColor: "#064e3b"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
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
      <body className="bg-slate-50 text-slate-900 min-h-screen selection:bg-amber-400 selection:text-emerald-950 font-sans">
        {children}
      </body>
    </html>
  );
}
