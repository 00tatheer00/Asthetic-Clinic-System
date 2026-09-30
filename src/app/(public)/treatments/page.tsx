import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/helpers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Treatments',
  description: 'Browse our complete range of professional skincare treatments at Brimish Skin Care in Peshawar.',
};

export default async function TreatmentsPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('treatment_categories')
    .select('*, treatments(id, name, slug, short_description, price, price_label, duration_minutes, image_url, is_featured)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'treatments' });

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-rose-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Our Treatments
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Expert aesthetic procedures tailored to your skin needs. Every treatment is performed with precision and care.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(categories || []).map((category) => (
            <div key={category.id} className="mb-16 last:mb-0">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                {category.description && (
                  <p className="mt-2 text-gray-500">{category.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(category.treatments || [])
                  .filter((t: { is_active?: boolean; deleted_at?: string | null }) =>
                    t.is_active !== false && !('deleted_at' in t && t.deleted_at)
                  )
                  .map((treatment: {
                    id: string;
                    name: string;
                    slug: string;
                    short_description: string | null;
                    price: number | null;
                    price_label: string | null;
                    duration_minutes: number | null;
                    is_featured: boolean;
                  }) => (
                    <div
                      key={treatment.id}
                      className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-300"
                    >
                      {treatment.is_featured && (
                        <div className="absolute top-4 right-4 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Featured
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
                        {treatment.name}
                      </h3>

                      {treatment.short_description && (
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">
                          {treatment.short_description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4">
                        {treatment.price ? (
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(treatment.price)}
                            {treatment.price_label && (
                              <span className="text-xs font-normal text-gray-400 ml-1">
                                ({treatment.price_label})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Contact for pricing</span>
                        )}

                        {treatment.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {treatment.duration_minutes} min
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <Link href="/book">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs group-hover:bg-rose-50 group-hover:border-rose-200 group-hover:text-rose-600 transition-colors"
                          >
                            Book Now
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {(!categories || categories.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No treatments available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
