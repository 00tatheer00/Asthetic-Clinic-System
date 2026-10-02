'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  MessageCircle,
  Star,
  Shield,
  MapPin,
  Stethoscope,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroCinematic() {
  // Theme mood: 'daylight' (bright day) or 'twilight' (ambient night)
  const [mood, setMood] = useState<'twilight' | 'daylight'>('daylight');

  return (
    <section className="relative w-full flex items-center justify-center overflow-hidden bg-black text-white py-12 sm:py-16 lg:py-20">
      {/* 1. Real Clinic Background Images (Day & Night) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Night Layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            mood === 'twilight' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src="/images/hero-clinic-night.jpg"
            alt="Brimish Skin Care Clinic Peshawar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-90"
          />
        </div>

        {/* Daylight Layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            mood === 'daylight' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src="/images/hero-clinic-day.jpg"
            alt="Brimish Skin Care Clinic Peshawar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-90"
          />
        </div>

        {/* Crisp Gradient Overlay for Perfect Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />

        {/* Top & Bottom Soft Fades */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* 2. Simple Day / Night Switcher */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs">
        <button
          type="button"
          onClick={() => setMood('twilight')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
            mood === 'twilight'
              ? 'bg-rose-950 text-rose-200 border border-rose-500/40 font-medium'
              : 'text-gray-300 hover:text-white'
          }`}
          title="Evening View"
        >
          <Moon className="h-3 w-3 text-rose-300" />
          <span>Night</span>
        </button>

        <button
          type="button"
          onClick={() => setMood('daylight')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
            mood === 'daylight'
              ? 'bg-amber-600 text-white font-medium'
              : 'text-gray-300 hover:text-white'
          }`}
          title="Day View"
        >
          <Sun className="h-3 w-3 text-amber-200" />
          <span>Day</span>
        </button>
      </div>

      {/* 3. Hero Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-4 text-center sm:text-left">
          
          {/* Clinic Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium text-rose-200 border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>Dr. Bilal Skin Care Clinic • Sami Tower, Ring Road, Peshawar</span>
          </div>

          {/* Short, Clear Headline in Easy Pakistani English */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight drop-shadow-md">
            Best Skin Care & Laser Clinic in Peshawar
          </h1>

          {/* Short, Clear Subtitle */}
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl">
            Get clear, healthy skin with Dr. Bilal. We provide HydraFacial, laser hair removal, acne treatments, and chemical peels with complete safety.
          </p>

          {/* High-Impact Hero Action Buttons with Best Hover Effects & Padding */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3.5">
            {/* 1. Book Appointment */}
            <Link href="/book" prefetch={true} className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white rounded-full px-7 py-3.5 h-12 text-sm font-semibold shadow-lg shadow-rose-900/30 hover:shadow-rose-600/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>Book Appointment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {/* 2. Straightforward WhatsApp Button */}
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 h-12 rounded-full text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-lg shadow-emerald-950/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              title="Chat with clinic on WhatsApp"
            >
              <MessageCircle className="h-4 w-4 fill-white text-white" />
              <span>WhatsApp</span>
            </a>

            {/* 3. View Treatments */}
            <Link href="/treatments" prefetch={true} className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full px-6 py-3.5 h-12 text-sm font-medium bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-sm hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                View Treatments
              </Button>
            </Link>
          </div>
        </div>

        {/* 4. Bottom Credibility Badges (Clean & Simple) */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-3 text-white/90">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">4.9 / 5.0 Rating</div>
              <div className="text-[10px] sm:text-[11px] text-gray-300">1,200+ Happy Patients</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">Doctor-Led Care</div>
              <div className="text-[10px] sm:text-[11px] text-gray-300">Checked by Dr. Bilal</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">No Advance Required</div>
              <div className="text-[10px] sm:text-[11px] text-gray-300">Pay at the Clinic</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">Sami Tower</div>
              <div className="text-[10px] sm:text-[11px] text-gray-300">Ring Road, Peshawar</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
