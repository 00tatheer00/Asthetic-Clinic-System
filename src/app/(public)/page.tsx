import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  Heart,
  Award,
  BadgeCheck,
  Stethoscope,
  Microscope,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeFaqSection, QuickBookBanner } from '@/components/public/home-interactive';

export const metadata = {
  title: 'Brimish Skin Care Clinic — Premier Aesthetic & Dermatology in Peshawar',
  description:
    'Experience Peshawar’s most trusted aesthetic dermatology clinic. Specialized HydraFacial, medical chemical peels, microneedling, and physician-guided skincare protocols by Dr. Bilal.',
};

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (High-Impact Luxury Medical Aesthetic)        */}
      {/* ============================================================ */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-rose-50/70 via-pink-50/20 to-white">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-20 h-80 w-80 rounded-full bg-pink-200/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Messaging & Conversion */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Doctor / Clinic Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-100/80 px-4 py-1.5 text-xs font-semibold text-rose-800 border border-rose-200 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span>Peshawar’s Trusted Aesthetic Clinic • Led by Dr. Bilal</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-950 tracking-tight leading-[1.12]">
                Where Medical Science Meets{' '}
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 bg-clip-text text-transparent italic">
                  Radiant Skin
                </span>
              </h1>

              {/* Supporting Subheading */}
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Personalized aesthetic treatments calibrated for South Asian skin tones. From deep-pore HydraFacial and clinical peels to collagen microneedling, discover gentle physician-led care in University Road, Peshawar.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link href="/book" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-102 transition-all duration-300"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Book Consultation</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/treatments" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-7 py-6 text-base font-medium border-gray-300 hover:bg-rose-50/50 hover:text-rose-700 hover:border-rose-200 transition-all"
                  >
                    View Treatments
                  </Button>
                </Link>
                <a
                  href="https://wa.me/923000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>

              {/* Social Proof & Trust Metrics */}
              <div className="pt-6 border-t border-gray-200/70 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-7 w-7 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        ✓
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">4.9/5 Rating</span>{' '}
                    <span className="text-gray-500">(1,200+ Patients)</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">100% Sterile</span>
                    <span className="text-gray-500">Hospital-Grade Protocol</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Photo Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow ring under card */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 opacity-30 blur-xl" />

                {/* Main Card Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-rose-100 bg-white shadow-2xl">
                  <div className="relative h-[380px] sm:h-[460px] w-full">
                    <Image
                      src="/images/hero-clinic.jpg"
                      alt="Brimish Skin Care Clinic Consultation in Peshawar"
                      fill
                      priority
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
                  </div>

                  {/* Floating Glassmorphic Pill 1: Top Doctor */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/40 shadow-lg flex items-center gap-2 text-xs font-semibold text-gray-900">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Dr. Bilal On Duty Today</span>
                  </div>

                  {/* Floating Glassmorphic Card 2: Bottom Summary */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-rose-600 font-bold">
                          Personalized Aesthetics
                        </div>
                        <div className="text-sm font-bold text-gray-900 font-serif">
                          Brimish Dermatology Lounge
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-rose-500" />
                          University Road, Peshawar
                        </div>
                      </div>
                      <Link href="/book">
                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs px-4">
                          Book Visit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CLINICAL EXCELLENCE RIBBON                                */}
      {/* ============================================================ */}
      <section className="border-y border-rose-100/80 bg-rose-50/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            {[
              {
                icon: Stethoscope,
                title: 'Physician-Led Care',
                desc: 'Every protocol overseen by certified doctor Dr. Bilal',
              },
              {
                icon: Shield,
                title: 'Strict Sterilization',
                desc: 'Autoclaved tools & single-use disposable consumables',
              },
              {
                icon: Microscope,
                title: 'Melanin-Safe Settings',
                desc: 'Calibrated safely for South Asian & Pakistani skin',
              },
              {
                icon: Award,
                title: 'Honest Pricing',
                desc: 'Transparent rates in PKR with zero forced packages',
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
      {/* 3. SIGNATURE CLINICAL TREATMENTS SHOWCASE                    */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Signature Aesthetic Menu
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              Targeted Treatments for Visible, Lasting Results
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Designed to treat acne, stubborn hyperpigmentation, open pores, and early aging using proven medical dermatology techniques.
            </p>
          </div>

          {/* Treatments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'HydraFacial MD Protocol',
                desc: 'Deep vortex pore extraction, salicylic exfoliation, and peptide hydration for radiant glass skin.',
                price: 'Rs. 5,000',
                time: '45 mins',
                tag: 'Most Popular Rejuvenation',
                image: '/images/treatment-hydrafacial.jpg',
                slug: 'hydrafacial-md',
              },
              {
                title: 'Medical Chemical Peels',
                desc: 'Custom medical-grade peel blends targeted for melasma, sun damage, and active acne breakouts.',
                price: 'From Rs. 3,500',
                time: '30 mins',
                tag: 'Pigmentation & Acne',
                image: '/images/treatment-peel.jpg',
                slug: 'chemical-peel',
              },
              {
                title: 'Collagen Microneedling',
                desc: 'Precision micro-puncture therapy stimulating natural collagen to smooth pitted acne scars and fine lines.',
                price: 'Rs. 6,000',
                time: '60 mins',
                tag: 'Texture & Scar Repair',
                image: '/images/treatment-microneedle.jpg',
                slug: 'collagen-microneedling',
              },
              {
                title: 'Laser Acne & Clarity Protocol',
                desc: 'Targeted phototherapy reducing P. acnes bacteria, vascular redness, and persistent stubborn marks.',
                price: 'Rs. 7,500',
                time: '45 mins',
                tag: 'Advanced Phototherapy',
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
                        className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-full text-xs font-semibold px-4 transition-colors"
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
                className="rounded-full px-8 py-5 border-gray-300 text-gray-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-semibold"
              >
                <span>Browse All Clinical Treatments & Add-Ons</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MEET DR. BILAL & THE CLINICAL PHILOSOPHY                 */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50/50 to-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Doctor Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-400 to-pink-300 opacity-20 blur-xl" />
                <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-white">
                  <div className="relative h-[480px] w-full">
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
                      <div className="text-xs text-rose-600 font-medium">Lead Aesthetic Physician</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>10+ Yrs Exp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Bio & Philosophy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
                <BadgeCheck className="h-3.5 w-3.5" />
                Physician Leadership
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 leading-tight">
                “Healthy, confident skin begins with authentic medical expertise — never marketing gimmicks.”
              </h2>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Founded by Dr. Bilal, Brimish Skin Care Clinic was created to provide Peshawar with transparent, safe, and scientifically grounded aesthetic treatments. We respect your natural anatomy and focus on restoring skin barrier health, collagen density, and vibrant tone without harsh or unnatural interventions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Certified in Advanced Aesthetic Protocols',
                  'Calibrated Treatments for Asian Skin Melanin',
                  'Rigorous 4-Step Sterilization Standards',
                  'Evidence-Based Home Care Regimens',
                  'Private & Confidential Female Care Suites',
                  'Transparent Consultation & Informed Consent',
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/book" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gray-950 hover:bg-gray-800 text-white rounded-full px-8 py-5 text-sm font-semibold shadow-md">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Consultation with Dr. Bilal
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto text-gray-700 hover:text-rose-600 text-sm font-semibold">
                    Read Our Clinical Story →
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
      <section className="py-16 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/10 text-center">
            <div className="p-4 space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-rose-400">15,000+</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Procedures Performed</div>
              <div className="text-[11px] text-gray-500">In Peshawar & KPK</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-rose-400">4.9 / 5.0</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Average Patient Rating</div>
              <div className="text-[11px] text-gray-500">Over 1,200+ Reviews</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-rose-400">10+ Years</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Clinical Experience</div>
              <div className="text-[11px] text-gray-500">Dedicated Dermatology</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-rose-400">100%</div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Sterilization Protocol</div>
              <div className="text-[11px] text-gray-500">Hospital-Grade Safety</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. REAL PATIENT TESTIMONIALS                                 */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              <Star className="h-3 w-3 fill-rose-600 text-rose-600" />
              Verified Patient Experiences
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              Loved by Patients Across Peshawar
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Real reviews from real individuals who trusted Dr. Bilal and Brimish Skin Care Clinic with their aesthetic journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Khadija Rahman',
                location: 'Hayatabad, Peshawar',
                treatment: 'HydraFacial MD + Peel',
                quote:
                  'I struggled with stubborn dullness and post-inflammatory acne marks for two years. After just 2 sessions with Dr. Bilal, my skin has a healthy glow without needing heavy foundation. The clinic is spotless and luxurious.',
              },
              {
                name: 'Amina Khattak',
                location: 'University Town, Peshawar',
                treatment: 'Acne Clear Protocol',
                quote:
                  'What impressed me most was that Dr. Bilal didn’t try to oversell expensive treatments. He carefully explained my skin barrier issues, gave me a simple regimen, and my cystic acne cleared up within weeks.',
              },
              {
                name: 'Zainab Afridi',
                location: 'DHA Peshawar',
                treatment: 'Microneedling Collagen Therapy',
                quote:
                  'My pitted acne scars on both cheeks have smoothed out remarkably. The procedure was comfortable with numbing cream, and the follow-up care was exceptional. Highly recommended clinic in Peshawar!',
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gray-200/80 bg-rose-50/20 p-8 flex flex-col justify-between space-y-5 hover:border-rose-200 transition-colors shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    “{review.quote}”
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between">
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
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700 font-semibold text-sm">
                Read All Verified Patient Reviews →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (Interactive Accordion)        */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-24 bg-gray-50/60 border-t border-gray-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">
              Answers & Reassurance
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Everything you need to know about our safety standards, procedures, and appointments.
            </p>
          </div>

          <HomeFaqSection />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. VIP CONVERSION CALL TO ACTION BANNER                      */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-white">
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
              'Peshawar’s premier aesthetic skincare and dermatology clinic led by Dr. Bilal.',
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
              jobTitle: 'Lead Aesthetic Physician & Dermatologist',
            },
          }),
        }}
      />
    </div>
  );
}
