'use client';

import React from 'react';
import { useConsultationModal } from './online-consultation-modal';
import { Video, Calendar } from 'lucide-react';

export function FloatingConsultationButton() {
  const { openConsultation } = useConsultationModal();

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button
        type="button"
        onClick={() => openConsultation('online')}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#2D1226] via-[#3B1530] to-[#1E0B19] hover:from-[#3B1530] hover:to-[#2D1226] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-xl hover:shadow-2xl shadow-rose-950/25 border border-rose-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Book Doctor Consultation (Online & In-Clinic)"
      >
        {/* Pulsing Green Doctor Status Indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>

        {/* Video / Stethoscope Call Icon */}
        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-rose-300 group-hover:rotate-12 transition-transform">
          <Video className="h-3.5 w-3.5" />
        </div>

        {/* Text Details (Online & Physical Consultation) */}
        <div className="text-left">
          <div className="text-[10px] font-semibold text-rose-300 leading-none uppercase tracking-wider hidden sm:block">
            Dr. Bilal Online
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1">
            <span>Online &amp; In-Clinic Consultation</span>
          </div>
        </div>
      </button>
    </div>
  );
}
