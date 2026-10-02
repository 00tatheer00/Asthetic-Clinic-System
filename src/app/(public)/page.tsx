import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  Stethoscope,
  Microscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeFaqSection, QuickBookBanner } from '@/components/public/home-interactive';
import { HeroCinematic } from '@/components/public/hero-cinematic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brimish Skin Care & Laser Clinic — Best Aesthetic Clinic in Peshawar | Dr. Bilal Ahmad',
  description:
    'Peshawar’s premier medical aesthetics and dermatology clinic led by Dr. Bilal Ahmad. Specialized in Medical HydraFacial MD, Chemical Peels, Microneedling, and Laser Skin Rejuvenation on University Road, Peshawar. Book without advance payment.',
  keywords: [
    'Brimish Skin Care',
    'Dr Bilal Ahmad dermatologist',
    'best skin clinic Peshawar',
    'skin specialist Peshawar',
    'HydraFacial Peshawar price',
    'laser clinic University Road Peshawar',
    'acne scar treatment Peshawar',
    'chemical peel Peshawar',
    'skin doctor Peshawar KP',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Brimish Skin Care & Laser Clinic — Top Aesthetic Clinic in Peshawar',
    description:
      'Physician-led clinical skincare, HydraFacial, laser therapy, and personalized acne solutions on University Road, Peshawar.',
    url: '/',
    siteName: 'Brimish Skin Care & Laser Clinic',
    images: [
      {
        url: '/images/hero-clinic.jpg',
        width: 1200,
        height: 630,
        alt: 'Brimish Skin Care Clinic Consultation Lounge Peshawar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brimish Skin Care & Laser Clinic Peshawar',
    description:
      'Best aesthetic dermatology and laser skin rejuvenation clinic in Peshawar by Dr. Bilal Ahmad.',
    images: ['/images/hero-clinic.jpg'],
  },
};

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <HeroCinematic />

      {/* ============================================================ */}
      {/* 2. CLINICAL EXCELLENCE RIBBON                                */}
      {/* ============================================================ */}
      <section className="border-y border-rose-100/80 bg-rose-50/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            {[
              {
                icon: Stethoscope,
                title: 'Doctor-Led Clinic',
                desc: 'Dr. Bilal personally examines every patient',
              },
              {
                icon: Shield,
                title: '100% Clean & Sterile',
                desc: 'Sterilized tools and disposable items for every patient',
              },
              {
                icon: Microscope,
                title: 'Safe for Pakistani Skin',
                desc: 'Specially tested for Asian skin tones with zero burning risk',
              },
              {
                icon: Award,
                title: 'Clear & Fair Rates',
                desc: 'Affordable rates in PKR with no hidden fees or forced packages',
              },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <div className="h-10 w-10 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. POPULAR SKIN TREATMENTS                                    */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              Our Treatments
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              Skin Care Treatments in Peshawar
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Effective, safe treatments for acne, scars, open pores, and dull skin by Dr. Bilal.
            </p>
          </div>

          {/* Treatments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'HydraFacial Treatment',
                desc: 'Deep cleansing, blackhead extraction, and peptide hydration for fresh, glowing skin.',
                price: 'Rs. 5,000',
                time: '45 mins',
                tag: 'Most Popular',
                image: '/images/treatment-hydrafacial.jpg',
                slug: 'hydrafacial-md',
              },
              {
                title: 'Chemical Peels',
                desc: 'Custom medical peel targeted for melasma, sun tan, dark marks, and active acne.',
                price: 'From Rs. 3,500',
                time: '30 mins',
                tag: 'Acne & Glow',
                image: '/images/treatment-peel.jpg',
                slug: 'chemical-peel',
              },
              {
                title: 'Microneedling Treatment',
                desc: 'Stimulates natural collagen to smooth deep acne scars, pores, and rough texture.',
                price: 'Rs. 6,000',
                time: '60 mins',
                tag: 'Scars & Texture',
                image: '/images/treatment-microneedle.jpg',
                slug: 'collagen-microneedling',
              },
              {
                title: 'Laser Acne Treatment',
                desc: 'Targeted laser therapy reducing acne-causing bacteria, redness, and stubborn pimples.',
                price: 'Rs. 7,500',
                time: '45 mins',
                tag: 'Laser Care',
                image: '/images/treatment-laser.jpg',
                slug: 'laser-acne-protocol',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="group flex flex-col rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-rose-200 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={t.image}
                    alt={t.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-rose-700 shadow-sm">
                    {t.tag}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-gray-900 group-hover:text-rose-600 transition-colors">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-3">
                      {t.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.time}
                      </div>
                      <div className="text-base font-bold text-gray-950 font-serif">
                        {t.price}
                      </div>
                    </div>
                    <Link href="/book">
                      <Button
                        size="sm"
                        className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-full text-xs font-semibold px-4 transition-colors cursor-pointer"
                      >
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/treatments">
              <Button
                variant="outline"
                className="rounded-full px-8 py-5 border-gray-300 text-gray-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-semibold cursor-pointer"
              >
                <span>View All Treatments & Prices</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MEET DR. BILAL                                            */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50/50 to-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Doctor Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-lg bg-white">
                  <div className="relative h-[440px] w-full">
                    <Image
                      src="/images/dr-bilal.jpg"
                      alt="Dr. Bilal Aesthetic Dermatologist at Brimish Skin Care Clinic Peshawar"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 450px"
                    />
                  </div>
                  <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-serif font-bold text-lg text-gray-900">Dr. Bilal</div>
                      <div className="text-xs text-rose-600 font-medium">Skin & Aesthetic Specialist</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>10+ Years Exp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Bio */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
                About Dr. Bilal
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 leading-tight">
                Real Medical Care for Healthy, Clear Skin
              </h2>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Dr. Bilal started Brimish Skin Care Clinic in Peshawar to provide honest, safe, and effective skin treatments. We believe in clear advice, genuine care, and real results—without pushing unnecessary packages or fake promises.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  'Certified skin & laser specialist',
                  'Safe procedures for Pakistani skin types',
                  'Strict hygiene and sterilized equipment',
                  'Easy-to-follow home skincare guidance',
                  'Separate, private rooms for female patients',
                  'Complete consultation before any treatment',
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/book" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gray-950 hover:bg-gray-800 text-white rounded-full px-7 py-3 text-sm font-semibold shadow-md cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Consultation with Dr. Bilal
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto text-gray-700 hover:text-rose-600 text-sm font-semibold cursor-pointer">
                    Read Our Story →
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CLINIC IMPACT BY THE NUMBERS                              */}
      {/* ============================================================ */}
      <section className="py-14 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-white/10 text-center">
            <div className="p-3 space-y-1">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-rose-400">15,000+</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Treatments Done</div>
              <div className="text-[11px] text-gray-500">In Peshawar & KPK</div>
            </div>
            <div className="p-3 space-y-1">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-rose-400">4.9 / 5.0</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Patient Rating</div>
              <div className="text-[11px] text-gray-500">Over 1,200+ Reviews</div>
            </div>
            <div className="p-3 space-y-1">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-rose-400">10+ Years</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Experience</div>
              <div className="text-[11px] text-gray-500">Skin & Aesthetic Care</div>
            </div>
            <div className="p-3 space-y-1">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-rose-400">100%</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Sterile & Clean</div>
              <div className="text-[11px] text-gray-500">Highest Safety Standards</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. REAL PATIENT TESTIMONIALS                                 */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              Patient Reviews
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              What Our Patients Say in Peshawar
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Real reviews from patients who visited Brimish Skin Care Clinic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Khadija Rahman',
                location: 'Hayatabad, Peshawar',
                treatment: 'HydraFacial + Peel',
                quote:
                  'I had stubborn dark marks and acne spots for two years. After just 2 sessions with Dr. Bilal, my skin has a healthy glow. The clinic is very clean and staff is polite.',
              },
              {
                name: 'Amina Khattak',
                location: 'University Town, Peshawar',
                treatment: 'Acne Treatment',
                quote:
                  'What I liked most is that Dr. Bilal did not try to sell expensive packages. He gave me simple advice, a proper cream regimen, and my cystic acne cleared up in weeks.',
              },
              {
                name: 'Zainab Afridi',
                location: 'DHA Peshawar',
                treatment: 'Microneedling Therapy',
                quote:
                  'My acne pits and scars have improved so much. The procedure was comfortable with numbing cream. Highly recommended skin specialist clinic in Peshawar!',
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gray-200/80 bg-rose-50/20 p-7 flex flex-col justify-between space-y-4 hover:border-rose-200 transition-colors shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    “{review.quote}”
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <div>
                    <div className="font-serif font-bold text-gray-900 text-sm">{review.name}</div>
                    <div className="text-xs text-gray-500">{review.location}</div>
                  </div>
                  <span className="text-[11px] bg-rose-100 text-rose-700 font-semibold px-2.5 py-1 rounded-full">
                    {review.treatment}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/reviews">
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700 font-semibold text-sm cursor-pointer">
                Read All Patient Reviews →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FREQUENTLY ASKED QUESTIONS                                */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-gray-50/60 border-t border-gray-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Common questions patients ask before booking an appointment.
            </p>
          </div>

          <HomeFaqSection />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. VIP CONVERSION CALL TO ACTION BANNER                      */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <QuickBookBanner />
        </div>
      </section>

      {/* Structured Schema.org Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalClinic',
            name: 'Brimish Skin Care Clinic',
            description:
              'Peshawar’s premier skin care and laser clinic led by Dr. Bilal.',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'University Road',
              addressLocality: 'Peshawar',
              addressRegion: 'Khyber Pakhtunkhwa',
              addressCountry: 'PK',
            },
            priceRange: 'PKR',
            telephone: '+92-300-0000000',
            medicalSpecialty: 'Dermatology',
            openingHours: 'Mo,Tu,We,Th,Fr,Sa 10:00-19:00',
            physician: {
              '@type': 'Physician',
              name: 'Dr. Bilal',
              jobTitle: 'Skin & Aesthetic Specialist',
            },
          }),
        }}
      />
    </div>
  );
}
