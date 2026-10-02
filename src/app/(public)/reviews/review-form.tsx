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
    try {
      const result = await submitReview(data);
      if (!result.success) {
        setServerError(result.error || 'Something went wrong.');
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to submit review. Please try again.');
    }
  };

  if (submitted) {
    return (
      <Card className="border border-emerald-200/80 bg-emerald-50/40 shadow-lg sticky top-24">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Review Submitted!</h3>
          <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
            Thank you for sharing your experience. Your review is now pending approval in Dr. Bilal&apos;s admin panel and will be published shortly.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="mt-2 rounded-full text-xs font-semibold border-stone-300"
          >
            Submit Another Review
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
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
              {serverError}
            </div>
          )}

          {/* Honeypot */}
          <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />

          {/* Rating */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Rating *</Label>
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setValue('rating', star, { shouldValidate: true })}
                  className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-gray-200 hover:text-amber-200'
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-xs font-bold text-amber-700 ml-1.5">
                  {rating}.0 / 5.0
                </span>
              )}
            </div>
            {errors.rating && <p className="text-xs text-red-600 font-medium">{errors.rating.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reviewer_name" className="text-xs font-semibold text-gray-700">Your Name *</Label>
            <Input
              id="reviewer_name"
              placeholder="e.g. Tatheer"
              {...register('reviewer_name')}
              className={cn('h-10 text-sm', errors.reviewer_name ? 'border-red-500' : '')}
            />
            {errors.reviewer_name && <p className="text-xs text-red-600 font-medium">{errors.reviewer_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="treatment_id" className="text-xs font-semibold text-gray-700">Treatment (optional)</Label>
            <select
              id="treatment_id"
              {...register('treatment_id')}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                errors.treatment_id ? 'border-red-500' : 'border-gray-200'
              )}
            >
              <option value="">Select clinical treatment (optional)...</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.treatment_id && <p className="text-xs text-red-600 font-medium">{errors.treatment_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review_text" className="text-xs font-semibold text-gray-700">Your Review *</Label>
            <Textarea
              id="review_text"
              placeholder="Share details of your clinical visit, treatment results, or consultation..."
              rows={4}
              {...register('review_text')}
              className={cn('text-sm', errors.review_text ? 'border-red-500' : '')}
            />
            {errors.review_text && <p className="text-xs text-red-600 font-medium">{errors.review_text.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full h-11 text-sm font-semibold shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Review...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
