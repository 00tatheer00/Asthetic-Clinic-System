import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Phone, Mail, Clock, Globe, MessageCircle } from 'lucide-react';
import { PUBLIC_NAV_ITEMS } from '@/lib/constants';
import { ClearCacheButton } from '@/components/clear-cache-button';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" prefetch={true} className="flex items-center gap-3 mb-4 group">
              <div className="relative h-11 w-11 rounded-2xl overflow-hidden bg-white p-0.5 shadow-md shadow-rose-950 border border-white/10 group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Brimish Skin Care Clinic Logo"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain p-0.5 rounded-[14px]"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white font-serif">Brimish</span>
                <span className="text-lg font-light text-rose-400 ml-1">Skin Care</span>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Clinic • Peshawar</div>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Expert aesthetic skincare treatments and premium products in Peshawar, Pakistan.
              Your journey to beautiful, healthy skin starts here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="text-sm text-gray-400 hover:text-rose-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/treatments" prefetch={true} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  All Treatments
                </Link>
              </li>
              <li>
                <Link href="/products" prefetch={true} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  Shop Products
                </Link>
              </li>
              <li>
                <Link href="/gallery" prefetch={true} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  Before & After
                </Link>
              </li>
              <li>
                <Link href="/book" prefetch={true} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
                <span className="text-sm text-gray-400">
                  Peshawar, Khyber Pakhtunkhwa,<br />Pakistan
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-rose-400 shrink-0" />
                <a href="tel:+92" className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  Contact for number
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-rose-400 shrink-0" />
                <a href="mailto:info@brimishskincare.com" className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                  info@brimishskincare.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-sm text-gray-400">Mon–Sat: 10am – 7pm</span>
              </li>
            </ul>

            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-800 text-gray-400 hover:bg-rose-500 hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-800 text-gray-400 hover:bg-rose-500 hover:text-white transition-all"
                aria-label="Facebook"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              &copy; {currentYear} Brimish Skin Care. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <ClearCacheButton variant="subtle" />
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> in Peshawar
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
