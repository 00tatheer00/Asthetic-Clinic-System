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

const SITE_URL = 'https://brimishskincare.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Brimish Skin Care & Laser Clinic Peshawar | Dr. Bilal Khan (Dermatologist & Cosmetologist)',
    template: '%s | Brimish Skin Care Clinic Peshawar',
  },
  description:
    'Peshawar’s premier aesthetic dermatology & laser clinic by Dr. Bilal Khan (Dermatologist & Cosmetologist, MD Aesthetic Medicine). Authentic Medical HydraFacial MD, Chemical Peels, Collagen Microneedling, Laser Hair Removal, and clinical skincare at Sami Tower, Ring Road, Peshawar.',
  applicationName: 'Brimish Skin Care Clinic',
  category: 'Medical Clinic, Aesthetic Dermatology, Laser Treatments, Skincare',
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
    'brimishskincare.com',
    'Dr Bilal Khan',
    'Dr Bilal Khan Dermatologist',
    'Dr Bilal Khan Cosmetologist',
    'Dr Bilal Ahmad',
    'Dr Bilal skin specialist Peshawar',
    'best dermatologist in Peshawar',
    'skin specialist in Peshawar',
    'aesthetic clinic Peshawar',
    'HydraFacial in Peshawar',
    'HydraFacial price Peshawar',
    'medical HydraFacial MD',
    'laser hair removal Peshawar',
    'acne scar treatment Peshawar',
    'melasma treatment Peshawar',
    'collagen microneedling Peshawar',
    'carbon laser peel Peshawar',
    'PRP hair treatment Peshawar',
    'PRP facial Peshawar',
    'chemical peel Peshawar',
    'aesthetic clinic Ring Road Peshawar',
    'Sami Tower Peshawar skin doctor',
    'dermatology clinic Khyber Pakhtunkhwa',
    'clinical skincare products Pakistan',
    'skin doctor near me Peshawar',
    'whitening facial Peshawar',
    'glass skin treatment Peshawar',
    'skin pigmentation clinic KP',
  ],
  authors: [
    { name: 'Dr. Bilal Khan (Dermatologist & Cosmetologist)', url: SITE_URL },
    { name: 'Dr. Bilal Ahmad (MD Aesthetic Medicine)', url: SITE_URL },
    { name: 'Brimish Clinical Editorial Board', url: SITE_URL },
  ],
  creator: 'Dr. Bilal Khan',
  publisher: 'Brimish Skin Care & Laser Clinic',
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-PK': SITE_URL,
      'ur-PK': SITE_URL,
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    alternateLocale: ['en_US', 'ur_PK'],
    url: SITE_URL,
    siteName: 'Brimish Skin Care & Laser Clinic',
    title: 'Brimish Skin Care & Laser Clinic Peshawar | Dr. Bilal Khan',
    description:
      'Premier aesthetic dermatology & laser clinic in Peshawar by Dr. Bilal Khan (Dermatologist & Cosmetologist). HydraFacial MD, medical peels, microneedling, laser hair removal & clinical skincare at Sami Tower, Ring Road.',
    images: [
      {
        url: `${SITE_URL}/images/hero-clinic.jpg`,
        width: 1200,
        height: 630,
        alt: 'Brimish Skin Care & Laser Clinic Consultation Lounge in Peshawar',
      },
      {
        url: `${SITE_URL}/images/logo.png`,
        width: 1024,
        height: 1024,
        alt: 'Brimish Official Gold Clinical Emblem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brimish Skin Care & Laser Clinic Peshawar | Dr. Bilal Khan',
    description:
      'Leading aesthetic dermatology & laser clinic in Peshawar led by Dr. Bilal Khan. Book doctor consultation with zero advance deposit.',
    images: [`${SITE_URL}/images/hero-clinic.jpg`],
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
    'geo.placename': 'Peshawar, Khyber Pakhtunkhwa, Pakistan',
    'geo.position': '34.0047;71.5369',
    'ICBM': '34.0047, 71.5369',
    'rating': 'general',
    'distribution': 'global',
    'revisit-after': '2 days',
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
