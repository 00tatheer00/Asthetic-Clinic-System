'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Star,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  Stethoscope,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroCinematic() {
  // Theme mood: 'twilight' (hero-cinema-dark.jpg) or 'daylight' (hero-luxury-bg.jpg)
  const [mood, setMood] = useState<'twilight' | 'daylight'>('twilight');

  const bgImage =
    mood === 'twilight'
      ? '/images/hero-cinema-dark.jpg'
      : '/images/hero-luxury-bg.jpg';

  const quickTreatments = [
    { name: 'HydraFacial MD', price: 'Rs. 5,000', id: 'hydrafacial' },
    { name: 'Laser Hair Removal', price: 'Rs. 1,000', id: 'laser-hair-removal' },
    { name: 'Pico Laser', price: 'Rs. 1,500', id: 'pico-laser' },
    { name: 'Medical Peel', price: 'Rs. 3,500', id: 'chemical-peel' },
    { name: 'Collagen Microneedling', price: 'Rs. 6,000', id: 'microneedling' },
  ];

  return (
    <section className="relative min-h-[92vh] lg:min-h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white">
      {/* 1. Full-Bleed Background Image with Cinematic Slow Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src={bgImage}
          alt="Brimish Aesthetic Dermatology Clinic Sanctuary"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center animate-slow-zoom transition-opacity duration-1000 brightness-95"
        />

        {/* 2. Cinematic Multi-Layered Overlays */}
        {/* Dark Obsidian & Plum Vignette for ultra-crisp typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#1c081a]/80 to-black/65" />
        {/* Top subtle fade from navbar */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
        {/* Bottom fade blending smoothly into next section */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#140612] via-[#140612]/70 to-transparent" />

        {/* Ambient atmospheric rose-gold radial glows */}
        <div className="absolute top-1/4 left-1/4 -ml-40 h-[500px] w-[500px] rounded-full bg-rose-500/15 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[120px]" />
      </div>

      {/* 3. Subtle Ambient Mood Switcher (Daylight / Twilight) */}
      <div className="absolute top-6 right-6 z-20 hidden sm:flex items-center gap-1.5 p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs">
        <button
          type="button"
          onClick={() => setMood('twilight')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
            mood === 'twilight'
              ? 'bg-rose-950/80 text-rose-200 border border-rose-500/30 shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Twilight Luxury Suite"
        >
          <Moon className="h-3 w-3" />
          <span>Twilight</span>
        </button>
        <button
          type="button"
          onClick={() => setMood('daylight')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
            mood === 'daylight'
              ? 'bg-white/25 text-white border border-white/30 shadow-xs'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Daylight Sanctuary"
        >
          <Sun className="h-3 w-3" />
          <span>Daylight</span>
        </button>
      </div>

      {/* 4. Hero Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col justify-center min-h-[90vh]">
        <div className="max-w-3xl space-y-6 text-center sm:text-left">
          
          {/* Doctor / Clinic Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-rose-200 border border-white/20 shadow-lg shadow-black/20">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            <span className="tracking-wider uppercase text-[11px] sm:text-xs">
              ✦ Peshawar’s Premier Aesthetic Clinic • Led by Dr. Bilal
            </span>
          </div>

          {/* Main Headline (Bespoke Editorial Serif) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.08] drop-shadow-md">
            Where Medical Precision Meets{' '}
            <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-100 to-amber-200">
              Flawless, Radiant Skin
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal max-w-2xl drop-shadow-sm">
            Physician-guided aesthetic protocols engineered exclusively for South Asian skin profiles. Experience medical HydraFacial MD, targeted chemical peels, and precision laser dermatology in an atmosphere of refined luxury on University Road, Peshawar.
          </p>

          {/* Quick Treatment Selector Glass Chips */}
          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-200/90 mb-3 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Signature Protocols • Direct Booking</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {quickTreatments.map((chip) => (
                <Link
                  key={chip.name}
                  href={`/book?treatment=${chip.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-md hover:border-rose-300/60 hover:scale-105 transition-all duration-200"
                >
                  <span>{chip.name}</span>
                  <span className="text-white/40">|</span>
                  <span className="font-bold text-rose-300">{chip.price}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Luxury CTA Group */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
            <Link href="/book" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-full px-9 py-6 text-base font-semibold shadow-2xl shadow-rose-600/50 hover:shadow-rose-500/70 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 border border-rose-400/40"
              >
                <Calendar className="h-4 w-4" />
                <span>Book In-Person Consultation</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-sm font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 backdrop-blur-md shadow-lg shadow-emerald-950/40 hover:scale-105 transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 fill-emerald-400" />
              <span>Chat on WhatsApp</span>
            </a>

            <Link href="/treatments" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full px-7 py-6 text-sm font-semibold bg-white/5 hover:bg-white/15 text-white border-white/25 hover:border-white/40 backdrop-blur-md transition-all hover:scale-105"
              >
                Explore Treatments
              </Button>
            </Link>
          </div>
        </div>

        {/* 5. Floating Bottom Credibility Dock */}
        <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-white/90">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="h-10 w-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">4.9 / 5.0 Rating</div>
              <div className="text-[11px] text-gray-300">1,200+ Peshawar Patients</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">100% Doctor Led</div>
              <div className="text-[11px] text-gray-300">PMC Registered Specialist</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">No Advance Card</div>
              <div className="text-[11px] text-gray-300">Pay on Arrival at Clinic</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">University Road</div>
              <div className="text-[11px] text-gray-300">Peshawar Premier Clinic</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
