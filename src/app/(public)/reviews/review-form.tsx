'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSubmissionSchema, type ReviewSubmissionInput } from '@/lib/validations';
import { submitReview } from '@/actions/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReviewForm({ treatments }: { treatments: Array<{ id: string; name: string }> }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewSubmissionInput>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: { reviewer_name: '', rating: 0, review_text: '', treatment_id: '', website: '' },
  });

  const rating = watch('rating');

  const onSubmit = async (data: ReviewSubmissionInput) => {
    setServerError(null);
    const result = await submitReview(data);
    if (!result.success) {
      setServerError(result.error || 'Something went wrong.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Thank You!</h3>
          <p className="text-sm text-gray-500 mt-2">Your review has been submitted for approval.</p>
          <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4 rounded-full text-sm">
            Write Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg sticky top-24">
      <CardHeader>
        <CardTitle className="text-base">Share Your Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{serverError}</div>
          )}

          {/* Honeypot */}
          <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setValue('rating', star)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-xs text-red-600">{errors.rating.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewer_name">Your Name *</Label>
            <Input id="reviewer_name" placeholder="Your name" {...register('reviewer_name')} className={errors.reviewer_name ? 'border-red-500' : ''} />
            {errors.reviewer_name && <p className="text-xs text-red-600">{errors.reviewer_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment_id">Treatment (optional)</Label>
            <select id="treatment_id" {...register('treatment_id')} className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm">
              <option value="">Select treatment...</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_text">Your Review *</Label>
            <Textarea id="review_text" placeholder="Share your experience..." rows={4} {...register('review_text')} className={errors.review_text ? 'border-red-500' : ''} />
            {errors.review_text && <p className="text-xs text-red-600">{errors.review_text.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full"
          >
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
