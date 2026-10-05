'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  title: string;
  category?: string;
  sessions?: string;
  description?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title,
  category = 'Clinical Case',
  sessions,
  description,
  className,
  aspectRatio = 'square',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-[16/10]',
    portrait: 'aspect-[4/5]',
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-3xl overflow-hidden border border-rose-100 shadow-md hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Slider Viewport */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden select-none cursor-ew-resize',
          aspectClasses[aspectRatio]
        )}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        role="slider"
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setSliderPosition((p) => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setSliderPosition((p) => Math.min(100, p + 5));
        }}
      >
        {/* After Image (Full width background) */}
        <div className="absolute inset-0">
          <Image
            src={afterImage}
            alt={`${title} - After Treatment Result`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wide uppercase">
            After
          </div>
        </div>

        {/* Before Image (Clipped layer) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={beforeImage}
            alt={`${title} - Before Treatment`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wide uppercase">
            Before
          </div>
        </div>

        {/* Divider Bar & Interactive Knob */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-xl border-2 border-rose-500 flex items-center justify-center text-rose-600 pointer-events-auto transition-transform group-hover:scale-110 active:scale-95">
            <MoveHorizontal className="h-5 w-5" />
          </div>
        </div>

        {/* Drag Hint Overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium px-3 py-1 rounded-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          <MoveHorizontal className="h-3 w-3" />
          Drag slider to compare
        </div>
      </div>

      {/* Case Details */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
            {category}
          </span>
          {sessions && (
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-rose-500" />
              {sessions}
            </span>
          )}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
