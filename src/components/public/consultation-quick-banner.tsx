'use client';

import React from 'react';
import { useConsultationModal } from './online-consultation-modal';
import { Sparkles, ArrowRight } from 'lucide-react';

export function ConsultationQuickBanner() {
  const { openConsultation } = useConsultationModal();

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#2D1226] via-[#3B1530] to-[#1E0B19] p-5 sm:p-7 text-white shadow-xl shadow-rose-950/20 border border-rose-300/20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-xs border border-white/10">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Fast 30-Second Booking</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
            Need an Initial Clinical Consultation with Dr. Bilal?
          </h2>
          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-sans">
            Skip browsing treatment packages. Reserve a dedicated 1-on-1 skin evaluation with Dr. Bilal Ahmad via live video call or in-clinic.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openConsultation('online')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 hover:scale-102 transition-all cursor-pointer"
          >
            <span>💻</span>
            <span>Online Consultation</span>
            <ArrowRight className="h-3.5 w-3.5 text-white/80" />
          </button>

          <button
            type="button"
            onClick={() => openConsultation('onsite')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-200/30 backdrop-blur-xs hover:scale-102 transition-all cursor-pointer"
          >
            <span>🏥</span>
            <span>On-Site Clinic Visit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
