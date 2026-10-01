'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // When route changes, flash and clear
    setNavigating(true);
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!navigating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9998] h-[3px] bg-transparent pointer-events-none overflow-hidden"
    >
      <div className="h-full bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 animate-[routeProgress_0.3s_ease-out_forwards] shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
    </div>
  );
}
