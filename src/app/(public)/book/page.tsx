import { BookingFlow } from './booking-flow';
import type { Metadata } from 'next';
import { Shield, Clock, Phone, MapPin, CheckCircle, Heart } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Book Doctor Consultation & Skin Treatment | Brimish Clinic Peshawar',
  description:
    'Book your medical skincare consultation with Dr. Bilal Ahmad in Peshawar. Select treatments, pick a date & time, and receive instant WhatsApp confirmation. Zero deposit, no advance card payment needed.',
  keywords: [
    'book dermatologist Peshawar',
    'Dr Bilal appointment booking',
    'skin doctor consultation online',
    'hydrafacial booking Peshawar',
    'laser consultation Peshawar',
  ],
  alternates: {
    canonical: '/book',
  },
  openGraph: {
    title: 'Book Appointment | Brimish Skin Care Clinic Peshawar',
    description:
      'Zero advance deposit. Select your treatment and reserve your slot with Dr. Bilal in Peshawar.',
    url: '/book',
  },
};

interface BookPageProps {
  searchParams: Promise<{
    treatment?: string;
  }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const resolvedParams = await searchParams;
  const initialTreatmentId = resolvedParams.treatment;

  return (
    <div className="bg-gradient-to-b from-[#2D1226]/[0.03] via-rose-50/30 to-white min-h-screen py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Clinic Banner */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider">
            Dr. Bilal Skin Care Clinic
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 tracking-tight font-bold">
            Book Your Appointment
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Book your skin consultation with Dr. Bilal on University Road, Peshawar. No advance payment required.
          </p>
        </div>

        {/* Full-Width Booking Flow Container */}
        <div className="w-full max-w-7xl mx-auto mb-16">
          <BookingFlow initialTreatmentId={initialTreatmentId} />
        </div>

        {/* Clinic Credibility & Trust Grid Below */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-gray-900 text-sm">No Deposit Required</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Book freely online with zero advance card payments. Pay comfortably upon arrival at our clinic.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-gray-900 text-sm">Instant WhatsApp Notice</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Receive your confirmed appointment details and clinic location directly on WhatsApp within minutes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-gray-900 text-sm">Flexible Rescheduling</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Life happens. If your schedule changes, simply reply to our WhatsApp text to adjust your slot.
            </p>
          </div>
        </div>

        {/* Urgent Appointment Footer Bar */}
        <div className="max-w-3xl mx-auto mt-10 p-5 rounded-2xl bg-gradient-to-r from-[#2D1226] to-[#1E0B19] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider">
              Need Same-Day Emergency Booking?
            </span>
            <p className="text-sm font-serif font-bold">
              Call our reception desk directly for urgent walk-in slots
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition-all hover:scale-102"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>+92 300 0000000</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
