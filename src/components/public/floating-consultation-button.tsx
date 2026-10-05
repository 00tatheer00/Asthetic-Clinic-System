'use client';

import React from 'react';
import { useConsultationModal } from './online-consultation-modal';
import { Sparkles, Video } from 'lucide-react';

export function FloatingConsultationButton() {
  const { openConsultation } = useConsultationModal();

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button
        type="button"
        onClick={() => openConsultation('online')}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#121927] to-[#1E293B] hover:from-[#1E293B] hover:to-[#0F172A] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Book Online Doctor Consultation"
      >
        {/* Pulsing Green Doctor Status Indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>

        {/* Video / Call Icon */}
        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-rose-300 group-hover:rotate-12 transition-transform">
          <Video className="h-3.5 w-3.5" />
        </div>

        {/* Text */}
        <div className="text-left">
          <div className="text-[10px] font-medium text-rose-300 leading-none uppercase tracking-wider hidden sm:block">
            Dr. Bilal Online
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1">
            <span>Online Consultation</span>
            <Sparkles className="h-3 w-3 text-amber-300 opacity-90" />
          </div>
        </div>
      </button>
    </div>
  );
}
