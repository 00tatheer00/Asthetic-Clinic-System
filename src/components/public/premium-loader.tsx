'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function PremiumLoader() {
  const [percent, setPercent] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(true);

  useEffect(() => {
    // Check if user already saw the loader in this session
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('brimish_intro_loader') : null;
    if (hasSeen) {
      setShouldRender(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      // Smooth and quick progression (~750ms total)
      const increment = current < 40 ? 5 : current < 75 ? 4 : current < 92 ? 3 : 2;
      current += increment;

      if (current >= 100) {
        current = 100;
        setPercent(100);
        clearInterval(interval);

        try {
          sessionStorage.setItem('brimish_intro_loader', 'true');
        } catch {
          // Ignore storage restrictions
        }

        setTimeout(() => {
          setIsLoaded(true);
          setTimeout(() => {
            setShouldRender(false);
          }, 500);
        }, 200);
      } else {
        setPercent(current);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  if (!shouldRender) return null;

  return (
    <aside
      aria-label="Loading Brimish Skin Care"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl transition-all duration-500 ease-out select-none pointer-events-none ${
        isLoaded ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft ambient rose glow */}
      <div className="absolute h-56 w-56 rounded-full bg-rose-100/50 blur-3xl pointer-events-none" />

      {/* Central Compact Pure Logo & Progress */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Pure Logo without borders or box */}
        <div className="relative w-20 sm:w-24 transition-transform duration-300">
          <Image
            src="/images/logo-pure.png"
            alt="Brimish Skin Care Clinic"
            width={96}
            height={96}
            priority
            className="w-full h-auto object-contain drop-shadow-[0_4px_12px_rgba(225,29,72,0.12)]"
          />
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-36 sm:w-40 h-[2.5px] rounded-full bg-rose-100/80 overflow-hidden mt-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 transition-all duration-75 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Small Elegant Percentage Counter */}
        <div className="mt-2 flex items-center justify-center">
          <span className="text-[11px] font-mono tracking-widest text-rose-900/60 font-medium">
            {percent}%
          </span>
        </div>
      </div>
    </aside>
  );
}
