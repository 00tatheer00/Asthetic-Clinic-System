import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PwaRegister } from '@/components/pwa-register';
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

export const metadata: Metadata = {
  title: {
    default: 'Brimish Skin Care — Premium Aesthetic Clinic in Peshawar',
    template: '%s | Brimish Skin Care Clinic',
  },
  description:
    'Experience world-class aesthetic dermatology and skin rejuvenation in Peshawar, Pakistan. HydraFacial, medical chemical peels, microneedling, and clinical skincare.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brimish Clinic',
  },
  keywords: [
    'skincare clinic Peshawar',
    'dermatologist Peshawar',
    'Dr Bilal skin clinic',
    'HydraFacial Peshawar',
    'aesthetic dermatology Pakistan',
    'chemical peel Peshawar',
    'acne treatment',
    'skin rejuvenation',
  ],
  authors: [{ name: 'Dr. Bilal & Brimish Clinical Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Brimish Skin Care Clinic',
    title: 'Brimish Skin Care — Premium Aesthetic Clinic in Peshawar',
    description:
      'Peshawar’s premier medical aesthetics clinic for skin rejuvenation, laser treatments, and physician-led skincare.',
    images: [
      {
        url: '/images/hero-clinic.jpg',
        width: 1200,
        height: 630,
        alt: 'Brimish Skin Care Clinic Consultation Lounge',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-rose-500 selection:text-white">
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
