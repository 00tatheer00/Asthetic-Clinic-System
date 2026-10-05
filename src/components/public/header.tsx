'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, Phone, MapPin, Clock, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { PUBLIC_NAV_ITEMS } from '@/lib/constants';
import { useCartStore } from '@/stores/cart-store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CLINIC_WHATSAPP_NUMBER } from '@/lib/utils/helpers';
import { ShieldCheck, Laptop } from 'lucide-react';
import { useConsultationModal } from '@/components/public/online-consultation-modal';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartItemsCount = useCartStore((s) => s.getItemCount());
  const { openConsultation } = useConsultationModal();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Clinic Info Bar */}
      <div className="hidden md:block bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white text-xs py-2 px-4 border-b border-white/10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6 text-gray-300">
            <span className="flex items-center gap-1.5 hover:text-rose-300 transition-colors">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              Sami Tower, Ring Road, Peshawar
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              Mon – Sat: 10:00 AM – 7:00 PM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              PMDC Reg # 98214-P Verified
            </span>
            <span className="text-rose-300 font-medium text-xs hidden lg:inline">
              Dr. Bilal Ahmad (MD Aesthetic) • Sami Tower, Ring Road, Peshawar
            </span>
            <a
              href={`https://wa.me/${CLINIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-300 hover:text-emerald-400 transition-colors font-medium"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              WhatsApp: 0335-6400959
            </a>
          </div>
        </div>
      </div>

      {/* Main Persistent Sticky Header */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300 border-b',
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-md shadow-gray-900/5 border-rose-100/60 py-2.5'
            : 'bg-white/90 backdrop-blur-md border-gray-100 py-3.5'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" prefetch={true} className="flex items-center gap-3 group focus:outline-none">
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl overflow-hidden p-0.5 shadow-md shadow-rose-900/10 border border-rose-200/60 bg-white transition-transform duration-300 group-hover:scale-105 shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Brimish Skin Care Clinic Logo"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain p-0.5 rounded-[14px]"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-950 font-serif">
                    Brimish
                  </span>
                  <span className="text-lg sm:text-xl font-light text-rose-500">
                    Skin Care
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium -mt-1 hidden sm:block">
                  Aesthetic Clinic • Peshawar
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-gray-50/80 p-1.5 rounded-full border border-gray-200/60 shadow-inner">
              {PUBLIC_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200',
                      isActive
                        ? 'bg-white text-rose-600 shadow-sm shadow-gray-200 font-bold'
                        : 'text-gray-600 hover:text-gray-950 hover:bg-white/60'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Phone quick call (Desktop/Tablet) */}
              <a
                href="tel:+923356400959"
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-rose-500" />
                <span>0335-6400959</span>
              </a>

              {/* Shopping Bag Cart */}
              <Link href="/order/cart" prefetch={true} className="relative group" aria-label="Shopping Cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-gray-700 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && cartItemsCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-rose-600 text-white border-2 border-white shadow-sm animate-pulse"
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Book Consultation Trigger */}
              <button
                type="button"
                onClick={() => openConsultation('online')}
                className="hidden sm:inline-flex bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white font-medium text-xs rounded-full px-5 py-2 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300 hover:scale-102 items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Book Consultation</span>
              </button>

              {/* Mobile Drawer Navigation Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-100 border border-gray-200">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 flex flex-col justify-between bg-white">
                  <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                  <div>
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-rose-50/40">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm border border-rose-200 shrink-0 bg-white">
                          <Image
                            src="/images/logo.png"
                            alt="Brimish Skin Care Logo"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain p-0.5"
                          />
                        </div>
                        <div>
                          <div className="font-serif font-bold text-base text-gray-900 leading-tight">
                            Brimish Skin Care
                          </div>
                          <div className="text-[11px] text-gray-500">Peshawar Aesthetic Clinic</div>
                        </div>
                      </div>
                    </div>

                    {/* Nav Links */}
                    <div className="px-3 py-4 space-y-1">
                      {PUBLIC_NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-rose-50 text-rose-600 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
                            )}
                          >
                            <span>{item.label}</span>
                            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-5 border-t border-gray-100 bg-gray-50/60 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        openConsultation('online');
                      }}
                      className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-200 cursor-pointer transition-all"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Book Consultation</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href="tel:+923356400959"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-rose-500" />
                        <span>Call Doctor</span>
                      </a>
                      <a
                        href={`https://wa.me/${CLINIC_WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100/50 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <div className="text-[11px] text-gray-400 text-center pt-2">
                      Mon – Sat: 10:00 AM – 7:00 PM • Sami Tower, Ring Road, Peshawar
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3">
        <a
          href={`https://wa.me/${CLINIC_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center text-emerald-600 text-[10px] font-medium px-2 py-1"
        >
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          <span>WhatsApp</span>
        </a>
        <a
          href="tel:+923356400959"
          className="flex flex-col items-center justify-center text-gray-600 text-[10px] font-medium px-2 py-1"
        >
          <Phone className="h-5 w-5 text-gray-700" />
          <span>Call Dr</span>
        </a>
        <button
          type="button"
          onClick={() => openConsultation('online')}
          className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-full text-xs font-semibold py-2.5 shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Book Consultation</span>
        </button>
      </div>
    </>
  );
}
