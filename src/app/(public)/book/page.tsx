import { createClient } from '@/lib/supabase/server';
import { BookingForm } from './booking-form';
import type { Metadata } from 'next';
import { Sparkles, Shield, Clock, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book an Appointment | Brimish Skin Care Clinic Peshawar',
  description:
    'Book your skincare consultation or aesthetic treatment at Brimish Skin Care clinic in Peshawar. Led by Dr. Bilal. Quick 2-minute booking with no advance fee.',
};

const FALLBACK_TREATMENTS = [
  {
    id: '9803b3c3-2e1d-44dd-b684-3782c0c90a9b',
    name: 'HydraFacial MD',
    category_id: '700fb2c5-0960-4ceb-97ea-38147b44a45e',
    price: 5000,
    price_label: 'Standard',
    duration_minutes: 45,
    treatment_categories: [{ name: 'Facial Treatments & Hydration' }],
  },
  {
    id: '76d0ac5f-682d-4a41-b130-81f37acc157e',
    name: 'Medical Chemical Peel',
    category_id: '0e6d7763-6b95-4413-b19d-4d7083a57136',
    price: 3500,
    price_label: 'From',
    duration_minutes: 30,
    treatment_categories: [{ name: 'Skin Rejuvenation & Peels' }],
  },
  {
    id: 'acde7ffc-fde9-4f72-a37f-ab0189da7653',
    name: 'Collagen Microneedling',
    category_id: '0e6d7763-6b95-4413-b19d-4d7083a57136',
    price: 6000,
    price_label: 'Per Session',
    duration_minutes: 60,
    treatment_categories: [{ name: 'Skin Rejuvenation & Peels' }],
  },
  {
    id: 'ff5d4e0d-47da-4bfe-81fb-ca494b5cf4a0',
    name: 'Acne Clear Clinical Protocol',
    category_id: '9e8aa083-6f44-4e82-aa6d-501609aee9fc',
    price: 8000,
    price_label: 'Full Protocol',
    duration_minutes: 60,
    treatment_categories: [{ name: 'Acne & Clarity Programs' }],
  },
];

const FALLBACK_HOURS = [
  { id: 'h-0', day_of_week: 0, open_time: '10:00:00', close_time: '19:00:00', is_closed: true },
  { id: 'h-1', day_of_week: 1, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
  { id: 'h-2', day_of_week: 2, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
  { id: 'h-3', day_of_week: 3, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
  { id: 'h-4', day_of_week: 4, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
  { id: 'h-5', day_of_week: 5, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
  { id: 'h-6', day_of_week: 6, open_time: '10:00:00', close_time: '19:00:00', is_closed: false },
];

export default async function BookPage() {
  let treatments: any[] = [];
  let hours: any[] = [];

  try {
    const supabase = await createClient();

    const { data: treatData, error: treatErr } = await supabase
      .from('treatments')
      .select('id, name, category_id, price, price_label, duration_minutes, treatment_categories(name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const { data: hoursData, error: hoursErr } = await supabase
      .from('operating_hours')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (!treatErr && treatData && treatData.length > 0) {
      treatments = treatData;
    } else {
      treatments = FALLBACK_TREATMENTS;
    }

    if (!hoursErr && hoursData && hoursData.length > 0) {
      hours = hoursData;
    } else {
      hours = FALLBACK_HOURS;
    }
  } catch (err) {
    console.error('Error fetching booking data:', err);
    treatments = FALLBACK_TREATMENTS;
    hours = FALLBACK_HOURS;
  }

  const displayTreatments = treatments.length > 0 ? treatments : FALLBACK_TREATMENTS;
  const displayHours = hours.length > 0 ? hours : FALLBACK_HOURS;

  return (
    <div className="bg-gradient-to-b from-rose-50/50 via-white to-gray-50/30 min-h-screen py-12 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-rose-600" />
            Convenient Online Booking
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-gray-950 tracking-tight">
            Schedule Your Visit with <span className="text-rose-600">Dr. Bilal</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Reserve your preferred consultation time. Our clinic coordinator will review your schedule and confirm your appointment within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Booking Form (Main Area) */}
          <div className="lg:col-span-7">
            <BookingForm treatments={displayTreatments} />
          </div>

          {/* Sidebar Info & Trust Badges */}
          <div className="lg:col-span-5 space-y-6">
            {/* Operating Hours Card */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-serif">
                  Clinic Consultation Hours
                </h3>
              </div>

              <div className="space-y-2.5 divide-y divide-gray-100">
                {displayHours.map((h) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={h.id} className="flex items-center justify-between text-xs sm:text-sm pt-2 first:pt-0">
                      <span className="text-gray-600 font-medium">{dayNames[h.day_of_week]}</span>
                      <span className={h.is_closed ? 'text-red-500 font-semibold' : 'text-gray-900 font-bold'}>
                        {h.is_closed
                          ? 'Closed (Off Day)'
                          : `${h.open_time?.slice(0, 5)} – ${h.close_time?.slice(0, 5)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-serif mb-4">
                How It Works
              </h3>
              <ol className="space-y-3.5 text-xs sm:text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold">1</span>
                  <span>Select your treatment and your preferred appointment time.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold">2</span>
                  <span>Our reception team reviews doctor availability and confirms your slot.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold">3</span>
                  <span>Receive SMS/email confirmation and arrive at our University Road clinic.</span>
                </li>
              </ol>
            </div>

            {/* Direct Contact Card */}
            <div className="rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 sm:p-7 text-white shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Phone className="h-4 w-4" />
                Direct Assistance
              </div>
              <h4 className="text-lg font-serif font-bold">Need Immediate Help?</h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                For same-day urgent appointments or inquiries regarding procedures, please reach us directly on WhatsApp or phone.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="https://wa.me/923000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3 px-4 transition-colors"
                >
                  WhatsApp: +92 300 0000000
                </a>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                  <MapPin className="h-3 w-3 text-rose-400" />
                  <span>University Road, Peshawar, KPK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
