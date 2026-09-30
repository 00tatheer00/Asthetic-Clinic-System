'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, Sparkles, Star, Shield, ArrowRight, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Are the treatments safe for South Asian / Pakistani skin tones?',
    a: 'Absolutely. South Asian skin requires specialized expertise due to a higher tendency for post-inflammatory hyperpigmentation (PIH). At Brimish Skin Care, Dr. Bilal and our clinical staff tailor peel concentrations, laser settings, and microneedling depths specifically calibrated for Asian skin types III to V.',
  },
  {
    q: 'What should I expect during my first consultation?',
    a: 'Your initial visit begins with a thorough skin examination, reviewing your history, lifestyle, and goals. We analyze your skin barrier health before recommending any procedure. You will receive an honest assessment and a customized treatment plan with transparent pricing.',
  },
  {
    q: 'Is there downtime after HydraFacial or Chemical Peels?',
    a: 'Our signature HydraFacial MD has zero downtime — you leave with immediate glow and hydration, perfect before weddings and events. Mild superficial peels have zero to 24 hours of light flaking, while deeper corrective protocols may require 3-5 days of gentle hydration and sun protection.',
  },
  {
    q: 'How many sessions are needed for acne scars or melasma?',
    a: 'While you will notice immediate texture refinement after session one, collagen remodeling for pitted acne scars typically requires 3 to 6 microneedling sessions spaced 4 weeks apart. Pigmentation and melasma protocols are customized with combined clinical peels and home maintenance.',
  },
  {
    q: 'How do I book an appointment, and what payment methods are accepted?',
    a: 'You can book directly on our website in under 60 seconds by selecting your preferred date and time slot. We accept Cash, Debit/Credit Cards, and direct Bank Transfers at the clinic counter.',
  },
];

export function HomeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="border border-gray-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:border-rose-200 shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-semibold text-gray-900 hover:text-rose-600 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg">{faq.q}</span>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center bg-rose-50 text-rose-600 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 bg-rose-600 text-white' : ''
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
            {isOpen && (
              <div className="px-6 pb-5 pt-1 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100 bg-rose-50/20">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function QuickBookBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 p-8 sm:p-12 lg:p-16 text-white shadow-2xl border border-white/10">
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Start Your Transformation Today
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
          Ready for Clear, Confident, <br />
          <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-rose-300 bg-clip-text text-transparent">
            Naturally Glowing Skin?
          </span>
        </h2>

        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Book your private consultation with Dr. Bilal and our aesthetic specialists in Peshawar. Experience medical expertise in an atmosphere of warmth and luxury.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/book" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-105 transition-all duration-300">
              <Calendar className="h-4 w-4" />
              <span>Book Appointment Online</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full backdrop-blur-md transition-all duration-300"
          >
            <span>Ask a Question on WhatsApp</span>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Zero Waiting Time With Appointment
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Strict Hygiene & Sterilization
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Private Female Treatment Suites
          </span>
        </div>
      </div>
    </div>
  );
}
