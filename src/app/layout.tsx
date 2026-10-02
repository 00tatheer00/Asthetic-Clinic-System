import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PwaRegister } from '@/components/pwa-register';
import { SeoStructuredData } from '@/components/public/seo-structured-data';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Brimish Skin Care & Laser Clinic — Best Aesthetic Clinic in Peshawar',
    template: '%s | Brimish Skin Care Clinic Peshawar',
  },
  description:
    'Peshawar’s premier medical aesthetics and dermatology clinic led by Dr. Bilal Ahmad. Authentic HydraFacial MD, medical chemical peels, microneedling, laser hair removal, and clinical skincare on University Road, Peshawar.',
  applicationName: 'Brimish Skin Care Clinic',
  generator: 'Next.js',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/logo.png', type: 'image/png' },
    ],
    shortcut: '/images/logo.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/images/logo.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brimish Clinic',
  },
  keywords: [
    'Brimish Skin Care',
    'Brimish Clinic Peshawar',
    'Dr Bilal Ahmad',
    'skin specialist Peshawar',
    'best dermatologist in Peshawar',
    'HydraFacial in Peshawar',
    'HydraFacial price Peshawar',
    'laser hair removal Peshawar',
    'aesthetic clinic University Road Peshawar',
    'medical chemical peel Peshawar',
    'acne scar treatment Peshawar',
    'melasma treatment Peshawar',
    'collagen microneedling Peshawar',
    'carbon laser peel Peshawar',
    'PRP hair treatment Peshawar',
    'skin whitening clinic Peshawar',
    'dermatology clinic Khyber Pakhtunkhwa',
    'clinical skincare products Pakistan',
  ],
  authors: [
    { name: 'Dr. Bilal Ahmad (MD Aesthetic Medicine)', url: SITE_URL },
    { name: 'Brimish Clinical Editorial Board' },
  ],
  creator: 'Dr. Bilal Ahmad',
  publisher: 'Brimish Skin Care & Laser Clinic',
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    alternateLocale: ['en_US', 'ur_PK'],
    url: SITE_URL,
    siteName: 'Brimish Skin Care & Laser Clinic',
    title: 'Brimish Skin Care & Laser Clinic — Premier Aesthetic Dermatology in Peshawar',
    description:
      'Experience physician-led clinical skincare & laser aesthetics in Peshawar, Pakistan. HydraFacial, medical peels, microneedling, and personalized acne solutions by Dr. Bilal.',
    images: [
      {
        url: '/images/hero-clinic.jpg',
        width: 1200,
        height: 630,
        alt: 'Brimish Skin Care & Laser Clinic Consultation Lounge in Peshawar',
      },
      {
        url: '/images/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Brimish Official Gold Emblem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brimish Skin Care & Laser Clinic Peshawar',
    description:
      'Leading aesthetic dermatology & laser clinic in Peshawar led by Dr. Bilal Ahmad. Book consultation with zero advance deposit.',
    images: ['/images/hero-clinic.jpg'],
    creator: '@brimishclinic',
    site: '@brimishclinic',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'geo.region': 'PK-KP',
    'geo.placename': 'Peshawar',
    'geo.position': '34.0047;71.5369',
    'ICBM': '34.0047, 71.5369',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-rose-500 selection:text-white">
        {/* Schema.org Structured Data */}
        <SeoStructuredData />

        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <PwaRegister />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
