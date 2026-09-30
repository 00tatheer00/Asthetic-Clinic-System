import { createClient } from '@/lib/supabase/server';
import { BookingForm } from './booking-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description:
    'Book your skincare appointment at Brimish Skin Care clinic in Peshawar. Choose from our range of professional treatments.',
};

export default async function BookPage() {
  const supabase = await createClient();

  const { data: treatments } = await supabase
    .from('treatments')
    .select('id, name, category_id, price, price_label, duration_minutes, treatment_categories(name)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  // Fetch operating hours for display
  const { data: hours } = await supabase
    .from('operating_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  return (
    <div className="bg-gradient-to-b from-rose-50/50 to-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Book an Appointment
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Choose your preferred treatment and time. We&apos;ll confirm your appointment within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm treatments={treatments || []} />
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Operating Hours */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Clinic Hours</h3>
              <div className="space-y-2">
                {(hours || []).map((h) => {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  return (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{dayNames[h.day_of_week]}</span>
                      <span className={h.is_closed ? 'text-red-500' : 'text-gray-900 font-medium'}>
                        {h.is_closed
                          ? 'Closed'
                          : `${h.open_time?.slice(0, 5)} – ${h.close_time?.slice(0, 5)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">How it works</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">1</span>
                  <span>Fill out the form with your details and preferred treatment.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">2</span>
                  <span>Our team will review and confirm within 24 hours.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">3</span>
                  <span>You&apos;ll receive an email/SMS confirmation with your appointment details.</span>
                </li>
              </ol>
            </div>

            {/* Contact */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
              <h3 className="text-sm font-semibold mb-2">Need help?</h3>
              <p className="text-sm text-gray-300">
                Call us or send a message for assistance with booking.
              </p>
              <a
                href="/contact"
                className="mt-3 inline-flex items-center text-sm text-rose-300 hover:text-rose-200 font-medium"
              >
                Contact us →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
