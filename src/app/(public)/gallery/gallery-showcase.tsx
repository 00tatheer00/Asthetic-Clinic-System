'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseItem {
  id: string;
  title: string | null;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  treatments?: { id: string; name: string; slug: string } | null;
}

interface GalleryShowcaseProps {
  cases: CaseItem[];
  treatments: Array<{ id: string; name: string; slug: string }>;
}

// Fallback showcase items if database doesn't have public cases yet
const FALLBACK_CASES: CaseItem[] = [
  {
    id: 'sample-1',
    title: 'Severe Acne & Post-Inflammatory Erythema',
    description: '4 sessions of Salicylic Peel combined with blue light therapy over 8 weeks.',
    before_image_url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
    after_image_url: 'https://images.unsplash.com/photo-1512290900672-1f5be67041a9?auto=format&fit=crop&w=800&q=80',
    treatments: { id: 't-1', name: 'Chemical Peel & Acne Therapy', slug: 'chemical-peel' },
  },
  {
    id: 'sample-2',
    title: 'HydraFacial Glow & Pore Refinement',
    description: 'Immediate radiance and sebum clearance following 1 session of Medical HydraFacial.',
    before_image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    after_image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    treatments: { id: 't-2', name: 'Signature HydraFacial', slug: 'hydrafacial' },
  },
  {
    id: 'sample-3',
    title: 'Melasma & Pigmentation Correction',
    description: '6 sessions of Q-Switched Nd:YAG Laser combined with home maintenance protocol.',
    before_image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    after_image_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    treatments: { id: 't-3', name: 'Carbon Laser / Laser Toning', slug: 'laser-toning' },
  },
];

function BeforeAfterSlider({ item }: { item: CaseItem }) {
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

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <Card className="border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col group">
      {/* Slider Viewport */}
      <div
        ref={containerRef}
        className="relative h-80 sm:h-96 w-full select-none overflow-hidden cursor-ew-resize bg-gray-100"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* AFTER Image (Full background) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.after_image_url}
          alt="After treatment result"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute top-3 right-3 z-10 bg-rose-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          AFTER
        </div>

        {/* BEFORE Image (Clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.before_image_url}
            alt="Before treatment result"
            className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          />
          <div className="absolute top-3 left-3 z-10 bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            BEFORE
          </div>
        </div>

        {/* Slider Divider Line & Thumb */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">
            ↔
          </div>
        </div>

        {/* Floating helper note */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          Drag slider to compare
        </div>
      </div>

      {/* Case Details */}
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div className="space-y-2">
          {item.treatments && (
            <Badge variant="outline" className="text-xs border-rose-200 text-rose-700 bg-rose-50/50">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              {item.treatments.name}
            </Badge>
          )}

          <h3 className="text-base font-bold text-gray-900 leading-snug">
            {item.title || 'Clinical Skin Transformation'}
          </h3>

          {item.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Patient Consent
          </span>
          <Link
            href="/book"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
          >
            Book Similar
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function GalleryShowcase({ cases, treatments }: GalleryShowcaseProps) {
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('all');

  const displayCases = cases.length > 0 ? cases : FALLBACK_CASES;

  const filteredCases =
    selectedTreatmentId === 'all'
      ? displayCases
      : displayCases.filter((c) => c.treatments?.id === selectedTreatmentId);

  return (
    <div className="space-y-10">
      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTreatmentId('all')}
          className={cn(
            'px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-sm',
            selectedTreatmentId === 'all'
              ? 'bg-rose-600 text-white shadow-rose-200'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          )}
        >
          All Procedures ({displayCases.length})
        </button>
        {treatments.map((t) => {
          const count = displayCases.filter((c) => c.treatments?.id === t.id).length;
          if (count === 0 && cases.length > 0) return null;

          return (
            <button
              key={t.id}
              onClick={() => setSelectedTreatmentId(t.id)}
              className={cn(
                'px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-sm',
                selectedTreatmentId === t.id
                  ? 'bg-rose-600 text-white shadow-rose-200'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCases.map((item) => (
          <BeforeAfterSlider key={item.id} item={item} />
        ))}
      </div>

      {/* Medical Ethics & Disclaimer Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-sm max-w-4xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h4 className="text-base font-bold text-gray-900">Patient Privacy & Clinical Transparency</h4>
        <p className="text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
          At Brimish Skin Care Clinic, all clinical photography is captured under controlled medical lighting and published only with formal, written, and revocable patient consent. Due to unique biological differences, individual treatment outcomes and session requirements may vary.
        </p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-xs h-10 px-6 shadow-sm transition-colors"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Book Your Clinical Consultation
          </Link>
      </div>
    </div>
  );
}
