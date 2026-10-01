import { createClient } from '@/lib/supabase/server';
import { GalleryShowcase } from './gallery-showcase';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinical Results & Before & After Gallery | Brimish Skin Care Clinic Peshawar',
  description:
    'Real patient treatment transformations at Brimish Skin Care Clinic, Peshawar. Real results for Acne, HydraFacial, Anti-Aging, and Pigmentation treatments.',
};

const FALLBACK_TREATMENTS = [
  { id: '9803b3c3-2e1d-44dd-b684-3782c0c90a9b', name: 'HydraFacial MD', slug: 'hydrafacial' },
  { id: '76d0ac5f-682d-4a41-b130-81f37acc157e', name: 'Medical Chemical Peel', slug: 'chemical-peel' },
  { id: 'acde7ffc-fde9-4f72-a37f-ab0189da7653', name: 'Collagen Microneedling', slug: 'microneedling' },
  { id: 'ff5d4e0d-47da-4bfe-81fb-ca494b5cf4a0', name: 'Acne Clear Clinical Protocol', slug: 'acne-clear-program' },
];

export default async function PublicGalleryPage() {
  let treatments: any[] = [];
  let formattedCases: any[] = [];

  try {
    const supabase = await createClient();

    // Fetch treatments for filtering
    const { data: treatmentData, error: tErr } = await supabase
      .from('treatments')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (!tErr && treatmentData && treatmentData.length > 0) {
      treatments = treatmentData;
    } else {
      treatments = FALLBACK_TREATMENTS;
    }

    // Fetch only public cases
    const { data: cases, error: cErr } = await supabase
      .from('before_after')
      .select(
        `
        id,
        title,
        description,
        before_image_url,
        after_image_url,
        created_at,
        treatments (id, name, slug)
      `
      )
      .eq('is_public', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!cErr && cases && cases.length > 0) {
      formattedCases = cases.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        before_image_url: c.before_image_url,
        after_image_url: c.after_image_url,
        treatments: Array.isArray(c.treatments) ? c.treatments[0] || null : c.treatments || null,
      }));
    }
  } catch (err) {
    console.error('Error fetching gallery data:', err);
    treatments = FALLBACK_TREATMENTS;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-gray-50/50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            ✨ Verified Clinical Transformations
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-extrabold text-gray-900 tracking-tight">
            Real Patients, <span className="text-rose-600">Visible Results</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Explore authentic before-and-after results achieved through our medical-grade skincare protocols, laser therapies, and advanced facial treatments in Peshawar.
          </p>
        </div>

        {/* Gallery Showcase with Interactive Sliders */}
        <GalleryShowcase cases={formattedCases} treatments={treatments} />
      </div>
    </div>
  );
}
