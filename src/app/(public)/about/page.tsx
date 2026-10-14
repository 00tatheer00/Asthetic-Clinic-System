import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import {
  ShieldCheck,
  Stethoscope,
  Award,
  HeartHandshake,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  MessageCircle,
  Star,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Dr. Bilal Khan & Brimish Skin Care Clinic | Peshawar Aesthetic Center',
  description:
    'Learn about Brimish Skin Care & Laser Clinic at Sami Tower, Ring Road, Peshawar. Led by Dr. Bilal Khan (Dermatologist & Cosmetologist, also known as Dr. Bilal Ahmad). Discover our clinical sterile protocols, physician-guided dermatology, and genuine patient care.',
  keywords: [
    'Dr Bilal Khan',
    'Dr Bilal khan Dermatologist & Cosmetologist',
    'Dr Bilal Ahmad',
    'Dr Bilal dermatologist Peshawar',
    'about Brimish skin clinic',
    'aesthetic doctor Peshawar',
    'Sami Tower skin clinic',
    'skin doctor Ring Road Peshawar',
    'Brimish Skin Care Dr Bilal',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Dr. Bilal Khan & Brimish Skin Care Clinic | Peshawar',
    description:
      'Physician-led clinical excellence, sterile aesthetic treatments, and proven skincare solutions in Peshawar by Dr. Bilal Khan.',
    url: '/about',
    images: ['/images/dr-bilal.jpg'],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-white py-16 md:py-24 border-b border-rose-100/50">
        <div className="container mx-auto px-4 max-w-6xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            Dr. Bilal Skin Care & Laser Clinic • Peshawar
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Clear, Glowing Skin <br className="hidden sm:inline" />
            <span className="text-rose-600">You Can Trust</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Experience exceptional skin care with Dr. Bilal, where advanced technology meets personalized expertise. Our treatments are thoughtfully designed to enhance your skin’s health, clarity, and natural radiance.
          </p>
        </div>
      </section>

      {/* Doctor & Philosophy Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Doctor Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Ambient Glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400/25 via-rose-500/20 to-amber-200/25 rounded-[32px] blur-md -z-10" />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 bg-white">
                  <div className="relative aspect-[4/5] sm:h-[500px] w-full bg-slate-100 overflow-hidden">
                    <Image
                      src="/images/dr-bilal.jpg"
                      alt="Dr. Bilal Khan - Dermatologist & Cosmetologist at Brimish Skin Care Clinic Peshawar"
                      fill
                      priority
                      className="object-cover object-top hover:scale-102 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />

                    {/* Floating Live Clinic Badge */}
                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-lg">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Sami Tower, Ring Road, Peshawar</span>
                    </div>

                    {/* Motto Ribbon from Reception Wall */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-md border border-white/15 p-3.5 text-white shadow-xl flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold font-sans">
                          Brimish Skin Care
                        </div>
                        <div className="text-xs font-serif font-medium text-rose-100 italic">
                          &ldquo;Healthy Skin • Confident You&rdquo;
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-300 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        <span>10+ Years</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Credentials Bar */}
                  <div className="p-5 bg-white border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold font-serif text-gray-950">Dr. Bilal Khan</h3>
                        <p className="text-xs text-rose-600 font-semibold tracking-wide">
                          Lead Dermatologist &amp; Cosmetologist (MD Aesthetic Medicine)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Certified Aesthetic Physician</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200">
                        <Award className="h-3.5 w-3.5 text-rose-600" />
                        <span>Founder &amp; Medical Director</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3.5 py-1 rounded-full">
                Clinical Philosophy &amp; Leadership
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Honest Medical Guidance. Real Clinical Results.
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Located at Sami Tower, Ring Road, Peshawar, Brimish Skin Care Clinic was founded by Dr. Bilal Khan with a singular purpose: to protect patients from hazardous steroid creams and offer international-standard dermatological and aesthetic treatments optimized for Pakistani skin.
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Whether you seek evidence-based acne eradication, melasma clearing, HydraFacial rejuvenation, or advanced laser care, every protocol is personally assessed and supervised by Dr. Bilal with rigorous sterile standards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Certified Aesthetic Practitioners & Dermatologists',
                  'Rigorous 4-Step Medical Sterilization Protocol',
                  'International Standard Clinical Laser & Aesthetic Tech',
                  'Tailored Protocols for Asian Skin Types & Tones',
                  'Transparent Pricing, Informed Consent & Zero Hidden Fees',
                  'Complimentary Follow-Up & Physician Skin Reviews',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-medium text-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Consultation Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link href="/book" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gray-950 hover:bg-gray-800 text-white rounded-full px-7 py-3 text-sm font-semibold shadow-md cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book with Dr. Bilal
                  </Button>
                </Link>
                <a
                  href="https://wa.me/923356400959"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 fill-white text-white" />
                  <span>WhatsApp 0335-6400959</span>
                </a>
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
                    <span>Sami Tower, Ring Road, Peshawar, Khyber Pakhtunkhwa, Pakistan</span>
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
