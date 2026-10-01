'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import {
  LayoutDashboard, Calendar, ShoppingCart, Package, Users,
  FileText, Warehouse, Stethoscope, Box, Image, Star,
  BarChart3, Settings, LogOut, Menu, ChevronDown, Bell,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { DASHBOARD_NAV_SECTIONS } from '@/lib/constants';
import { getInitials } from '@/lib/utils/helpers';
import type { Staff } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClearCacheButton } from '@/components/clear-cache-button';
import { clearBrowserCacheAndReload } from '@/lib/cache-utils';
import { RefreshCw } from 'lucide-react';
import { RouteProgressBar } from '@/components/public/route-progress-bar';

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Calendar, ShoppingCart, Package, Users,
  FileText, Warehouse, Stethoscope, Box, Image, Star,
  BarChart3, Settings,
};

interface DashboardShellProps {
  staff: Staff;
  children: React.ReactNode;
}

export function DashboardShell({ staff, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = staff.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const navContent = (
    <ScrollArea className="flex-1 py-2">
      {DASHBOARD_NAV_SECTIONS.map((section) => {
        const visibleItems = section.items.filter(
          (item) => !('adminOnly' in item && item.adminOnly) || isAdmin
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
            )}
            {visibleItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all mx-2',
                    isActive
                      ? 'bg-rose-50 text-rose-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-rose-600')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full">{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{link}</div>;
            })}
          </div>
        );
      })}
    </ScrollArea>
  );

  return (
    <div className="fixed inset-0 h-screen w-screen flex overflow-hidden bg-slate-50">
      <Suspense fallback={null}>
        <RouteProgressBar />
      </Suspense>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full border-r border-gray-200 bg-white transition-all duration-300 shrink-0 select-none z-20',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 shrink-0 px-4 border-b border-gray-100 bg-white', collapsed && 'justify-center px-2')}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-rose-100 shadow-sm shrink-0 bg-white">
              <NextImage
                src="/images/logo.png"
                alt="Brimish Skin Care Logo"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 tracking-tight font-serif leading-tight">
                  Brimish
                </span>
                <span className="text-[10px] text-rose-600 font-medium tracking-wide">
                  Clinic Intelligence
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        {navContent}

        {/* Collapse Toggle */}
        <div className="border-t border-gray-100 p-2 shrink-0 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-gray-400 hover:text-gray-600"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
                <div className="flex items-center h-16 px-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-rose-100 shadow-sm shrink-0 bg-white">
                      <NextImage
                        src="/images/logo.png"
                        alt="Brimish Skin Care Logo"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 font-serif">Brimish</span>
                  </div>
                </div>
                <div className="flex flex-col h-[calc(100%-4rem)]">
                  {navContent}
                </div>
              </SheetContent>
            </Sheet>

            <h2 className="text-sm font-medium text-gray-700 hidden sm:block">
              Clinic Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Clear Browser Cache & Reload Button */}
            <ClearCacheButton variant="icon" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-gray-500">
              <Bell className="h-[18px] w-[18px]" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-md hover:bg-gray-100 transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-rose-100 text-rose-700 text-xs font-semibold">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium text-gray-900 leading-none">
                    {staff.name}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-none mt-0.5">
                    {staff.role === 'super_admin' ? 'Admin' : 'Receptionist'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 sm:hidden">
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-gray-500">
                    {staff.role === 'super_admin' ? 'Admin' : 'Receptionist'}
                  </p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => clearBrowserCacheAndReload()}
                  className="text-gray-700 hover:text-rose-600 cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4 text-rose-500" />
                  Clear Cache & Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-20 animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
