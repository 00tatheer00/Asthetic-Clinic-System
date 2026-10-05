import { Suspense } from 'react';
import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { BookingModalProvider } from '@/components/public/booking-modal';
import { OnlineConsultationModalProvider } from '@/components/public/online-consultation-modal';
import { PremiumLoader } from '@/components/public/premium-loader';
import { RouteProgressBar } from '@/components/public/route-progress-bar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingModalProvider>
      <OnlineConsultationModalProvider>
        <PremiumLoader />
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <div className="flex min-h-screen flex-col">
          <PublicHeader />
          <main className="flex-1">{children}</main>
          <PublicFooter />
        </div>
      </OnlineConsultationModalProvider>
    </BookingModalProvider>
  );
}
