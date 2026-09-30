'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ShoppingBag, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { PUBLIC_NAV_ITEMS } from '@/lib/constants';
import { useCartStore } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-200/50 transition-shadow group-hover:shadow-lg group-hover:shadow-rose-200/70">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                Brimish
              </span>
              <span className="text-lg font-light text-gray-400 ml-1">
                Skin Care
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/order/cart" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-gray-900"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-rose-500 text-white border-2 border-white"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Book Appointment CTA */}
            <Link href="/book" className="hidden sm:block">
              <Button
                size="sm"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-200/50 rounded-full px-5"
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Book Now
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between px-4 py-4 border-b">
                    <span className="text-lg font-bold text-gray-900">Menu</span>
                  </div>

                  {/* Mobile Nav Links */}
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {PUBLIC_NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'block px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                          pathname === item.href
                            ? 'text-rose-600 bg-rose-50'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile CTA */}
                  <div className="px-4 py-4 border-t">
                    <Link href="/book" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
