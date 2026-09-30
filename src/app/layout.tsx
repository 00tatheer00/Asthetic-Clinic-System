import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Brimish Skin Care — Premium Skincare Clinic in Peshawar',
    template: '%s | Brimish Skin Care',
  },
  description:
    'Expert aesthetic skincare treatments and premium products in Peshawar, Pakistan. HydraFacial, chemical peels, microneedling, and more. Book your appointment today.',
  keywords: [
    'skincare clinic',
    'Peshawar',
    'dermatologist',
    'HydraFacial',
    'chemical peel',
    'acne treatment',
    'skin care products',
    'Pakistan',
  ],
  authors: [{ name: 'Brimish Skin Care' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Brimish Skin Care',
    title: 'Brimish Skin Care — Premium Skincare Clinic in Peshawar',
    description:
      'Expert aesthetic skincare treatments and premium products in Peshawar, Pakistan.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
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
