'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentBookingSchema, type AppointmentBookingInput } from '@/lib/validations';
import { createPublicAppointment } from '@/actions/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

interface Treatment {
  id: string;
  name: string;
  category_id: string | null;
  price: number | null;
  price_label: string | null;
  duration_minutes: number | null;
  treatment_categories: { name: string }[] | null;
}

interface BookingFormProps {
  treatments: Treatment[];
}

export function BookingForm({ treatments }: BookingFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentBookingInput>({
    resolver: zodResolver(appointmentBookingSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      treatment_id: '',
      scheduled_at: '',
      message: '',
    },
  });

  const selectedTreatmentId = watch('treatment_id');
  const selectedTreatment = treatments.find((t) => t.id === selectedTreatmentId);

  // Group treatments by category
  const grouped = treatments.reduce(
    (acc, t) => {
      const cat = t.treatment_categories?.[0]?.name || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    },
    {} as Record<string, Treatment[]>
  );

  const onSubmit = async (data: AppointmentBookingInput) => {
    setServerError(null);
    const result = await createPublicAppointment(data);

    if (!result.success) {
      setServerError(result.error || 'Something went wrong.');
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Request Received!</h2>
          <p className="mt-3 text-gray-600 max-w-md mx-auto">
            Thank you for your booking request. Our team will review and confirm
            your appointment within 24 hours. You&apos;ll receive a confirmation
            via email or phone.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="mt-6 rounded-full"
          >
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Treatment Selection */}
          <div className="space-y-2">
            <Label htmlFor="treatment_id" className="text-sm font-medium">
              Select Treatment <span className="text-red-500">*</span>
            </Label>
            <select
              id="treatment_id"
              {...register('treatment_id')}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Choose a treatment...</option>
              {Object.entries(grouped).map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.price ? ` — ${formatCurrency(t.price)}` : ''}
                      {t.price_label ? ` (${t.price_label})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.treatment_id && (
              <p className="text-xs text-red-600">{errors.treatment_id.message}</p>
            )}

            {/* Selected treatment info */}
            {selectedTreatment && (
              <div className="flex items-center gap-4 mt-2 p-3 rounded-lg bg-rose-50 text-sm">
                {selectedTreatment.price && (
                  <span className="flex items-center gap-1 text-rose-700 font-medium">
                    {formatCurrency(selectedTreatment.price)}
                    {selectedTreatment.price_label && (
                      <span className="text-rose-500 text-xs">({selectedTreatment.price_label})</span>
                    )}
                  </span>
                )}
                {selectedTreatment.duration_minutes && (
                  <span className="flex items-center gap-1 text-rose-600">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedTreatment.duration_minutes} min
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preferred Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at" className="text-sm font-medium">
              Preferred Date & Time <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="scheduled_at"
                type="datetime-local"
                {...register('scheduled_at')}
                min={new Date().toISOString().slice(0, 16)}
                className={errors.scheduled_at ? 'border-red-500' : ''}
              />
            </div>
            {errors.scheduled_at && (
              <p className="text-xs text-red-600">{errors.scheduled_at.message}</p>
            )}
            <p className="text-xs text-gray-400">
              This is your preferred time. We&apos;ll confirm the exact slot.
            </p>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_name"
                placeholder="Your full name"
                {...register('customer_name')}
                className={errors.customer_name ? 'border-red-500' : ''}
              />
              {errors.customer_name && (
                <p className="text-xs text-red-600">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone" className="text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_phone"
                placeholder="03001234567"
                {...register('customer_phone')}
                className={errors.customer_phone ? 'border-red-500' : ''}
              />
              {errors.customer_phone && (
                <p className="text-xs text-red-600">{errors.customer_phone.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="customer_email" className="text-sm font-medium">
              Email <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="customer_email"
              type="email"
              placeholder="your@email.com"
              {...register('customer_email')}
              className={errors.customer_email ? 'border-red-500' : ''}
            />
            {errors.customer_email && (
              <p className="text-xs text-red-600">{errors.customer_email.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Any specific concerns or requirements..."
              rows={3}
              {...register('message')}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && (
              <p className="text-xs text-red-600">{errors.message.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50 rounded-full h-12 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Request Appointment
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-400">
            No login required. No payment needed to book.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
