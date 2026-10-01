import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Award,
  HeartHandshake,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Brimish Skin Care Clinic Peshawar',
  description:
    'Learn about Brimish Skin Care Clinic in Peshawar. Founded on evidence-based dermatology, certified aesthetic physicians, and state-of-the-art laser technology.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-white py-16 md:py-24 border-b border-rose-100/50">
        <div className="container mx-auto px-4 max-w-6xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            ✨ Peshawar&apos;s Premier Aesthetic Medicine Clinic
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Scientific Skincare, <br className="hidden sm:inline" />
            <span className="text-rose-600">Personalized for You</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            At Brimish Skin Care Clinic, we bridge the gap between medical dermatology and aesthetic luxury. Every treatment plan is uniquely crafted by our licensed practitioners to deliver healthy, radiant, and sustainable skin transformations.
          </p>
        </div>
      </section>

      {/* Doctor & Philosophy Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Image / Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-rose-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dr-bilal.jpg"
                  alt="Dr. Bilal at Brimish Skin Care Clinic"
                  className="w-full h-[450px] object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-xl font-bold font-serif">Dr. Bilal</h3>
                  <p className="text-rose-200 text-xs mt-0.5">Lead Aesthetic Physician & Dermatologist</p>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                Our Medical Philosophy
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                No Quick Fixes. Only Long-Term, Evidence-Based Skin Health.
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Founded in Peshawar, Brimish Skin Care Clinic was established with a singular mission: to eliminate misleading beauty fads and deliver safe, medically validated aesthetic treatments suited to South Asian skin profiles.
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Whether you are treating persistent cystic acne, hormonal pigmentation, sun damage, or seeking age-defying rejuvenation, our clinic utilizes medical-grade clinical equipment, sterile treatment protocols, and evidence-based home care regimens.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Certified Aesthetic Practitioners',
                  'Rigorous 4-Step Sterilization Protocol',
                  'International Standard Clinical Equipment',
                  'Custom Protocols for Asian Skin Types',
                  'Transparent Pricing & Consent',
                  'Complimentary Follow-Up Reviews',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-medium text-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-16 bg-gray-50/70 border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">The Brimish Standard</h2>
            <p className="text-xs md:text-sm text-gray-500">
              Why thousands of patients in Khyber Pakhtunkhwa trust us with their skin health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-gray-200/80 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Patient Safety First</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Every procedure is preceded by a comprehensive skin assessment, medical history review, and skin patch test to ensure zero adverse reactions.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200/80 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Cutting-Edge Laser Tech</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We invest in state-of-the-art Q-Switched Nd:YAG lasers, Hydrafacial MD machines, and medical LED therapy for reliable clinical results.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200/80 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Ongoing Support</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Skincare is an ongoing journey. We provide dedicated WhatsApp post-procedure support and personalized home-care guidance after every visit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-gray-900 text-white p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Visit Our Clinic
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">
                  Experience World-Class Aesthetic Care in Peshawar
                </h3>
                <div className="space-y-2 pt-2 text-xs text-rose-100">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-rose-300 shrink-0 mt-0.5" />
                    <span>University Road / Near Hayatabad, Peshawar, Khyber Pakhtunkhwa, Pakistan</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-rose-300 shrink-0 mt-0.5" />
                    <span>Monday – Saturday: 10:00 AM – 8:00 PM (Sunday Closed)</span>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right space-y-3">
                <p className="text-xs text-rose-200">
                  Ready to start your skin transformation? Consult directly with our doctor.
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center bg-white hover:bg-rose-50 text-rose-900 font-bold rounded-xl h-11 px-8 text-sm shadow-lg transition-colors"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book an Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
