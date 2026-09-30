import { createClient } from '@/lib/supabase/server';
import { ReviewForm } from './review-form';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Read what our patients say about Brimish Skin Care clinic.',
};

export default async function ReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, review_text, created_at, treatments(name)')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: treatments } = await supabase
    .from('treatments')
    .select('id, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-rose-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Patient Reviews
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from our patients about their experience at Brimish Skin Care.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Reviews List */}
            <div className="lg:col-span-2">
              {(!reviews || reviews.length === 0) ? (
                <div className="text-center py-16">
                  <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-sm font-bold text-rose-600">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {(review.treatments as { name: string }[] | null)?.[0] && (
                          <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                            {(review.treatments as { name: string }[])[0].name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Review */}
            <div>
              <ReviewForm treatments={treatments || []} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
