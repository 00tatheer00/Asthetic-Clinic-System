import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/helpers';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Treatments | Brimish Skin Care Clinic Peshawar',
  description:
    'Browse our complete range of professional aesthetic and medical dermatology treatments at Brimish Skin Care in Peshawar. Led by Dr. Bilal.',
};

// Rich fallback categories & treatments if database connection is cold or empty
const FALLBACK_CATEGORIES = [
  {
    id: '700fb2c5-0960-4ceb-97ea-38147b44a45e',
    name: 'Facial Treatments & Hydration',
    description: 'Medical-grade vortex cleansing, deep pore extraction, and intensive skin hydration.',
    treatments: [
      {
        id: '9803b3c3-2e1d-44dd-b684-3782c0c90a9b',
        name: 'HydraFacial MD',
        slug: 'hydrafacial',
        short_description:
          'Deep vortex pore cleansing, gentle salicylic acid exfoliation, antioxidant hydration, and targeted peptide serum infusion for instant glass-skin radiance.',
        price: 5000,
        price_label: 'Standard Protocol',
        duration_minutes: 45,
        image_url: '/images/treatment-hydrafacial.jpg',
        is_featured: true,
      },
      {
        id: 'fallback-t-glow',
        name: 'Oxygen Rejuvenation Glow Facial',
        slug: 'oxygen-facial',
        short_description:
          'Hyperbaric oxygen infusion enriched with vitamins A, C, and E to revitalize fatigued skin, boost cellular turnover, and restore natural luminous glow.',
        price: 4500,
        price_label: 'Per Session',
        duration_minutes: 50,
        image_url: '/images/treatment-hydrafacial.jpg',
        is_featured: false,
      },
    ],
  },
  {
    id: '0e6d7763-6b95-4413-b19d-4d7083a57136',
    name: 'Skin Rejuvenation & Resurfacing',
    description: 'Advanced protocols targeting melasma, fine lines, texture irregularities, and loss of firmness.',
    treatments: [
      {
        id: '76d0ac5f-682d-4a41-b130-81f37acc157e',
        name: 'Medical Chemical Peel',
        slug: 'chemical-peel',
        short_description:
          'Dermatologist-formulated multi-acid blend targeting stubborn hyperpigmentation, sun damage, dark spots, and dull outer skin layers with minimal downtime.',
        price: 3500,
        price_label: 'From',
        duration_minutes: 30,
        image_url: '/images/treatment-peel.jpg',
        is_featured: true,
      },
      {
        id: 'acde7ffc-fde9-4f72-a37f-ab0189da7653',
        name: 'Collagen Microneedling',
        slug: 'microneedling',
        short_description:
          'Precision micro-puncture therapy stimulating natural fibroblast collagen synthesis to smooth pitted acne scars, reduce enlarged pores, and tighten skin.',
        price: 6000,
        price_label: 'Per Session',
        duration_minutes: 60,
        image_url: '/images/treatment-microneedle.jpg',
        is_featured: true,
      },
    ],
  },
  {
    id: '9e8aa083-6f44-4e82-aa6d-501609aee9fc',
    name: 'Acne & Clarity Programs',
    description: 'Comprehensive medical interventions for active cystic acne, inflammation, and red scarring.',
    treatments: [
      {
        id: 'ff5d4e0d-47da-4bfe-81fb-ca494b5cf4a0',
        name: 'Acne Clear Clinical Protocol',
        slug: 'acne-clear-program',
        short_description:
          'Comprehensive multi-step treatment combining medical pore unclogging, antibacterial phototherapy, and sebum-calming therapeutic infusions overseen by Dr. Bilal.',
        price: 8000,
        price_label: 'Full Protocol',
        duration_minutes: 60,
        image_url: '/images/treatment-laser.jpg',
        is_featured: true,
      },
      {
        id: 'fallback-laser-clarity',
        name: 'Laser Acne Clarity & Calming Therapy',
        slug: 'laser-acne-therapy',
        short_description:
          'Targeted vascular phototherapy reducing P. acnes bacteria and persistent post-inflammatory redness (erythema) without skin peeling.',
        price: 7500,
        price_label: 'Per Session',
        duration_minutes: 45,
        image_url: '/images/treatment-laser.jpg',
        is_featured: false,
      },
    ],
  },
];

export default async function TreatmentsPage() {
  let categories: any[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('treatment_categories')
      .select('*, treatments(id, name, slug, short_description, price, price_label, duration_minutes, image_url, is_featured)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order')
      .order('sort_order', { referencedTable: 'treatments' });

    if (!error && data && data.length > 0) {
      categories = data;
    } else {
      categories = FALLBACK_CATEGORIES;
    }
  } catch (err) {
    console.error('Error fetching treatment categories:', err);
    categories = FALLBACK_CATEGORIES;
  }

  // Ensure every category has treatments
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="bg-white min-h-screen">
      {/* Luxury Hero Banner */}
      <section className="relative bg-gradient-to-b from-rose-50/80 via-pink-50/30 to-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 -mt-20 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-pink-200/20 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-900 border border-rose-200/60 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-rose-600" />
            <span>CLINICAL AESTHETIC DERMATOLOGY MENU</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-950 tracking-tight">
            Evidence-Based Treatments for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500">
              Transformative Skin Health
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every procedure at Brimish Skin Care is physician-directed, utilizing medical-grade equipment calibrated precisely for Pakistani and South Asian skin types.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              100% Doctor Performed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Hospital-Grade Sterilization
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-rose-600" />
              Zero Forced Packages
            </span>
          </div>
        </div>
      </section>

      {/* Categories & Treatments Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
          {displayCategories.map((category) => {
            const rawTreatments = category.treatments || [];
            const activeTreatments = rawTreatments.filter(
              (t: { is_active?: boolean; deleted_at?: string | null }) =>
                t.is_active !== false && !('deleted_at' in t && t.deleted_at)
            );

            if (activeTreatments.length === 0) return null;

            return (
              <div key={category.id} className="relative">
                {/* Category Header */}
                <div className="mb-8 border-b border-gray-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
                      {category.name}
                    </h2>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-fit">
                      {activeTreatments.length} Available Protocol{activeTreatments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {category.description && (
                    <p className="mt-2 text-sm text-gray-500 max-w-3xl leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Treatment Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {activeTreatments.map((treatment: {
                    id: string;
                    name: string;
                    slug: string;
                    short_description: string | null;
                    price: number | null;
                    price_label: string | null;
                    duration_minutes: number | null;
                    image_url?: string | null;
                    is_featured?: boolean;
                  }) => (
                    <div
                      key={treatment.id}
                      className="group relative flex flex-col justify-between rounded-3xl border border-gray-200/90 bg-white p-7 shadow-xs hover:shadow-xl hover:border-rose-200 transition-all duration-300"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        {treatment.is_featured ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800">
                            <Sparkles className="h-3 w-3 text-rose-600" />
                            Featured Signature
                          </div>
                        ) : (
                          <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">
                            Clinical Protocol
                          </div>
                        )}

                        {treatment.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {treatment.duration_minutes} mins
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-serif font-bold text-gray-950 group-hover:text-rose-600 transition-colors">
                          {treatment.name}
                        </h3>

                        {treatment.short_description && (
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {treatment.short_description}
                          </p>
                        )}
                      </div>

                      {/* Price & Action */}
                      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                            Treatment Fee
                          </div>
                          {treatment.price ? (
                            <div className="text-xl font-serif font-bold text-gray-950">
                              {formatCurrency(treatment.price)}
                              {treatment.price_label && (
                                <span className="text-xs font-normal text-gray-500 ml-1.5">
                                  ({treatment.price_label})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Consultation Required</span>
                          )}
                        </div>

                        <Link href={`/book?treatment=${encodeURIComponent(treatment.id)}`}>
                          <Button
                            size="sm"
                            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-5 shadow-sm shadow-rose-200"
                          >
                            Book Visit
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Book Consult Bottom Banner */}
      <section className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 py-16 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold">
            Unsure Which Treatment Your Skin Needs?
          </h2>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Schedule an initial clinical consultation with Dr. Bilal. We analyze your skin condition with digital assessment tools and prescribe only what truly benefits your skin health.
          </p>
          <div className="pt-2">
            <Link href="/book">
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full px-8 py-6 text-sm font-semibold shadow-lg shadow-rose-500/30"
              >
                Book In-Person Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
