'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CheckCircle2, Star, Shield, ArrowRight, Calendar, Phone, MessageCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const HOME_FAQS: FaqItem[] = [
  {
    q: 'Where is Brimish Skin Care Clinic located in Peshawar?',
    a: 'We are conveniently located at Sami Tower, Ring Road, Peshawar. Dedicated parking and a comfortable, private clinic environment are available for all patients.',
  },
  {
    q: 'Does Dr. Bilal personally examine and treat patients?',
    a: 'Yes, all clinical evaluations, skin diagnoses, and advanced laser/aesthetic procedures are personally conducted or directly supervised by Dr. Bilal.',
  },
  {
    q: 'How do I book an appointment?',
    a: 'You can select your preferred treatment and time directly through our online booking button, or simply send us a message on WhatsApp for instant confirmation.',
  },
  {
    q: 'Are the treatments safe for Pakistani skin tones?',
    a: 'Absolutely. We use FDA-approved medical equipment and customize settings specifically suited to South Asian skin to prevent hyperpigmentation or burns.',
  },
  {
    q: 'What are your clinic charges and consultation fees?',
    a: 'Our rates are transparent and reasonable in PKR with zero hidden costs. You can view all procedure prices on our Treatments page or ask us directly on WhatsApp.',
  },
];

export function HomeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {HOME_FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-xs transition-colors"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="font-serif font-bold text-gray-900 text-base sm:text-lg">
                {faq.q}
              </span>
              <span
                className={`flex items-center justify-center h-8 w-8 rounded-full bg-rose-50 text-rose-600 transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180 bg-rose-100 text-rose-700' : ''
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/30">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-8 p-6 rounded-2xl bg-rose-50/40 border border-rose-100 text-center space-y-3">
        <p className="text-sm text-gray-700 font-medium">
          Have more questions? Contact Dr. Bilal’s team directly on WhatsApp or call our clinic desk.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 fill-white text-white" />
            <span>WhatsApp</span>
          </a>
          <a
            href="tel:+923000000000"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-xs transition-colors cursor-pointer"
          >
            <Phone className="h-3.5 w-3.5 text-rose-600" />
            <span>Call +92 300 0000000</span>
          </a>
        </div>
      </div>
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wide uppercase">
          Book Your Visit Today
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
          Ready for Clear, Confident, <br />
          <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-rose-300 bg-clip-text text-transparent">
            Naturally Glowing Skin?
          </span>
        </h2>

        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Book your consultation with Dr. Bilal at Brimish Skin Care Clinic at Sami Tower, Ring Road, Peshawar. Safe and effective skin treatments for real results.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/book" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer">
              <Calendar className="h-4 w-4" />
              <span>Book Appointment Online</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
          <a
            href="https://wa.me/923356400959"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-emerald-950/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            <span>WhatsApp</span>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Zero Waiting Time With Appointment
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            100% Sterile & Clean Clinic
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Private Rooms for Ladies
          </span>
        </div>
      </div>
    </div>
  );
}
