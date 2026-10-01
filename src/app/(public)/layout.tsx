import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { BookingModalProvider } from '@/components/public/booking-modal';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingModalProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </BookingModalProvider>
  );
}
