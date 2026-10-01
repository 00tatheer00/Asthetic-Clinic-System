'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function PremiumLoader() {
  const [percent, setPercent] = useState<number>(0);
  const [phaseText, setPhaseText] = useState<string>('Sterile Clinical Standards...');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(true);

  useEffect(() => {
    // Check if user already saw the loader in this session to maintain high browsing speed
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('brimish_intro_loader') : null;
    if (hasSeen) {
      setShouldRender(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      // Smooth progression with realistic easing
      const increment = current < 30 ? 4 : current < 70 ? 3 : current < 92 ? 2 : 1;
      current += increment;

      if (current >= 100) {
        current = 100;
        setPercent(100);
        setPhaseText('Welcome to Brimish Skin Care');
        clearInterval(interval);

        // Mark as seen in session
        try {
          sessionStorage.setItem('brimish_intro_loader', 'true');
        } catch {
          // Ignore storage restrictions
        }

        // Trigger smooth fade out
        setTimeout(() => {
          setIsLoaded(true);
          setTimeout(() => {
            setShouldRender(false);
          }, 600);
        }, 350);
      } else {
        setPercent(current);
        if (current < 25) {
          setPhaseText('Sterile Clinical Standards...');
        } else if (current < 55) {
          setPhaseText('Advanced Laser & Dermatology...');
        } else if (current < 85) {
          setPhaseText('Personalized Care by Dr. Bilal...');
        } else {
          setPhaseText('Preparing Clinic Experience...');
        }
      }
    }, 28);

    return () => clearInterval(interval);
  }, []);

  if (!shouldRender) return null;

  return (
    <aside
      aria-label="Loading Brimish Skin Care Clinic"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d050a] text-white transition-all duration-700 ease-out select-none pointer-events-none ${
        isLoaded ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-rose-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-pink-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute h-72 w-72 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Central luxury emblem & percentage animation */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Realistic Logo with Metallic Ring Aura */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-500/40 via-amber-400/30 to-rose-400/40 blur-md opacity-70 animate-pulse" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden shadow-2xl bg-white border border-rose-300/40 p-1 flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Brimish Skin Care Clinic Logo"
              width={112}
              height={112}
              priority
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        {/* Clinic Name in Serif Luxury Typography */}
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
          Brimish Skin Care
        </h2>
        <p className="text-xs uppercase tracking-[0.25em] text-rose-300 font-medium mt-1">
          Aesthetic Clinic • Peshawar
        </p>

        {/* Real-time Smooth Percentage Counter */}
        <div className="mt-8 flex items-baseline gap-1">
          <span className="font-serif text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-md">
            {percent}
          </span>
          <span className="font-serif text-xl font-light text-rose-400">%</span>
        </div>

        {/* Sleek Rose-Gold Progress Line */}
        <div className="w-56 sm:w-64 h-1.5 rounded-full bg-white/10 overflow-hidden mt-4 p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-600 via-pink-400 to-amber-300 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(244,63,94,0.7)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Dynamic Status Ticker */}
        <p className="text-xs text-gray-400 font-medium tracking-wide mt-3 h-4 transition-all duration-200">
          {phaseText}
        </p>
      </div>

      {/* Bottom Medical Signature */}
      <div className="absolute bottom-8 text-[11px] text-gray-500 tracking-wider uppercase font-medium">
        Led by Dr. Bilal • University Road
      </div>
    </aside>
  );
}
