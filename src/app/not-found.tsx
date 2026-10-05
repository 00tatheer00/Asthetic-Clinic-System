import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Stethoscope, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50/40 via-white to-white px-4 py-16 text-center select-none">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-rose-200/50 rounded-full blur-2xl transform scale-150 pointer-events-none" />
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-white p-2 shadow-xl shadow-rose-900/10 border border-rose-100 flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Brimish Skin Care Clinic"
            width={72}
            height={72}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-xs font-bold tracking-wider uppercase mb-3">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight max-w-md">
        The clinic page you are looking for doesn&apos;t exist
      </h1>

      <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
        The link may have moved or the address was entered incorrectly. You can explore our treatments or book a consultation below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="outline" className="rounded-xl border-gray-200 text-xs font-semibold gap-1.5 px-4 py-2.5">
            <Home className="h-3.5 w-3.5" />
            <span>Return to Home</span>
          </Button>
        </Link>
        <Link href="/treatments">
          <Button variant="outline" className="rounded-xl border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100/60 text-xs font-semibold gap-1.5 px-4 py-2.5">
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Explore Treatments</span>
          </Button>
        </Link>
        <Link href="/book">
          <Button className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-200 text-xs font-semibold gap-1.5 px-5 py-2.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Book Consultation</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
