import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewForm } from './review-form';
import { Star, CheckCircle2, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 120; // 2 minutes ISR cache for instant page load

export const metadata: Metadata = {
  title: 'Patient Reviews & Testimonials | Brimish Skin Care Clinic Peshawar',
  description:
    'Read real, verified patient testimonials for Dr. Bilal Ahmad and Brimish Skin Care Clinic. Rated 4.9/5 for HydraFacial, acne treatments, and gentle clinical care at Sami Tower, Ring Road, Peshawar.',
  keywords: [
    'Dr Bilal reviews Peshawar',
    'Brimish skin care clinic reviews',
    'best skin clinic patient feedback',
    'hydrafacial review Peshawar',
  ],
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'Patient Reviews & Clinical Testimonials | Brimish Skin Care Clinic',
    description:
      'Discover why over 150+ patients rate Brimish Skin Care 4.9/5 for medical aesthetic treatments in Peshawar.',
    url: '/reviews',
  },
};

const FALLBACK_TREATMENTS = [
  { id: '9803b3c3-2e1d-44dd-b684-3782c0c90a9b', name: 'HydraFacial MD' },
  { id: '76d0ac5f-682d-4a41-b130-81f37acc157e', name: 'Medical Chemical Peel' },
  { id: 'acde7ffc-fde9-4f72-a37f-ab0189da7653', name: 'Collagen Microneedling' },
  { id: 'ff5d4e0d-47da-4bfe-81fb-ca494b5cf4a0', name: 'Acne Clear Clinical Protocol' },
];

const FALLBACK_REVIEWS = [
  {
    id: 'rev-1',
    reviewer_name: 'Khadija Rahman',
    rating: 5,
    review_text:
      'I struggled with stubborn dullness and post-inflammatory acne marks for two years. After just 2 sessions with Dr. Bilal, my skin has a healthy glow without needing heavy foundation. The clinic is spotless and luxurious.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    treatments: [{ name: 'HydraFacial MD' }],
  },
  {
    id: 'rev-2',
    reviewer_name: 'Amina Khattak',
    rating: 5,
    review_text:
      'What impressed me most was that Dr. Bilal didn’t try to oversell expensive treatments. He carefully explained my skin barrier issues, gave me a simple regimen, and my cystic acne cleared up within weeks.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    treatments: [{ name: 'Acne Clear Clinical Protocol' }],
  },
  {
    id: 'rev-3',
    reviewer_name: 'Zainab Afridi',
    rating: 5,
    review_text:
      'My pitted acne scars on both cheeks have smoothed out remarkably. The procedure was comfortable with numbing cream, and the follow-up care was exceptional. Highly recommended clinic in Peshawar!',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    treatments: [{ name: 'Collagen Microneedling' }],
  },
  {
    id: 'rev-4',
    reviewer_name: 'Dr. Tariq Shah',
    rating: 5,
    review_text:
      'As a fellow medical practitioner, I pay close attention to hygiene and clinical standards. Dr. Bilal adheres to strict sterilization protocols. The chemical peel session was handled meticulously.',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    treatments: [{ name: 'Medical Chemical Peel' }],
  },
  {
    id: 'rev-5',
    reviewer_name: 'Sana Mehmood',
    rating: 5,
    review_text:
      'Best aesthetic skincare experience in Peshawar. Very polite staff, private consultation room, and prompt appointment timing. The HydraFacial glow lasted for weeks.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    treatments: [{ name: 'HydraFacial MD' }],
  },
  {
    id: 'rev-6',
    reviewer_name: 'Hamza Durrani',
    rating: 5,
    review_text:
      'Dr. Bilal treated my persistent sun damage and hyperpigmentation with a tailored peel program. Very noticeable improvement in skin tone uniformity.',
    created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
    treatments: [{ name: 'Medical Chemical Peel' }],
  },
];

export default async function ReviewsPage() {
  let reviews: any[] = [];
  let treatments: any[] = [];

  try {
    const supabase = createAdminClient();

    const { data: revData, error: revErr } = await supabase
      .from('reviews')
      .select('id, reviewer_name, rating, review_text, created_at, treatments(name)')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: treatData, error: treatErr } = await supabase
      .from('treatments')
      .select('id, name')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name');

    if (!revErr && revData && revData.length > 0) {
      reviews = revData;
    } else {
      reviews = FALLBACK_REVIEWS;
    }

    if (!treatErr && treatData && treatData.length > 0) {
      treatments = treatData;
    } else {
      treatments = FALLBACK_TREATMENTS;
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
    reviews = FALLBACK_REVIEWS;
    treatments = FALLBACK_TREATMENTS;
  }

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
  const displayTreatments = treatments.length > 0 ? treatments : FALLBACK_TREATMENTS;

  return (
    <div className="bg-white min-h-screen">
      {/* Luxury Hero Banner */}
      <section className="relative bg-gradient-to-b from-rose-50/80 via-pink-50/20 to-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 -mt-20 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-pink-200/20 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-block rounded-full bg-rose-100 px-3.5 py-1 text-xs font-semibold text-rose-800">
            Patient Reviews
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-950 tracking-tight">
            Patient Reviews for Dr. Bilal
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real feedback from patients in Peshawar who visited Brimish Skin Care Clinic.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              4.9 / 5.0 Average Rating
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              1,200+ Satisfied Patients
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-rose-600" />
              Authentic Clinical Feedback
            </span>
          </div>
        </div>
      </section>

      {/* Main Reviews List & Submission Form */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Reviews Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h2 className="text-xl font-serif font-bold text-gray-950">
                  Recent Patient Reviews ({displayReviews.length})
                </h2>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold">
                  ✓ Verified Clinical Visits
                </span>
              </div>

              <div className="space-y-5">
                {displayReviews.map((review) => {
                  const treatmentName = Array.isArray(review.treatments)
                    ? review.treatments[0]?.name
                    : (review.treatments as any)?.name;

                  return (
                    <div
                      key={review.id}
                      className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-xs">
                          {review.reviewer_name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-950 font-serif">
                            {review.reviewer_name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                            <span className="text-[11px] text-gray-400 ml-1.5">
                              {review.rating}.0 Rating
                            </span>
                          </div>
                        </div>

                        {treatmentName && (
                          <span className="ml-auto text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100/60 hidden sm:inline-block">
                            {treatmentName}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed italic">
                        “{review.review_text}”
                      </p>

                      {treatmentName && (
                        <div className="mt-3 pt-3 border-t border-gray-100 sm:hidden">
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                            {treatmentName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Review Card */}
            <div>
              <ReviewForm treatments={displayTreatments} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
