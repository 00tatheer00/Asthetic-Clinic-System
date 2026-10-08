// Application-wide constants

export const APP_NAME = 'Brimish Skin Care';
export const APP_DESCRIPTION = 'Premium aesthetic skincare clinic in Peshawar, Pakistan. Expert treatments, quality products, and compassionate care for all skin types.';
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';

// Currency
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs.';
export const CURRENCY_LOCALE = 'en-PK';

// Timezone
export const TIMEZONE = 'Asia/Karachi';

// Phone validation (Pakistani mobile number)
export const PK_PHONE_REGEX = /^03[0-9]{9}$/;
export const PK_PHONE_DISPLAY_REGEX = /^03\d{2}-?\d{7}$/;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Rate limiting (requests per window)
export const RATE_LIMITS = {
  booking: { requests: 10, windowMs: 60 * 1000 }, // 10/min
  order: { requests: 5, windowMs: 60 * 1000 }, // 5/min
  review: { requests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/day
  contact: { requests: 5, windowMs: 60 * 1000 }, // 5/min
  dashboard: { requests: 100, windowMs: 60 * 1000 }, // 100/min
} as const;

// Invoice numbering
export const INVOICE_PREFIX = 'BSC';
export const ORDER_PREFIX = 'BSC-ORD';

// Appointment settings
export const APPOINTMENT_STALE_HOURS = 48; // Hours before pending appointment expires
export const APPOINTMENT_REMINDER_HOURS = 24; // Hours before appointment to send reminder

// Stock defaults
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Appointment status display labels
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  checked_in: 'Checked In',
  completed: 'Completed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

// Order status display labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  shipped: 'Shipped',
  delivered: 'Delivered',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
};

// Payment status labels
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

// Invoice status labels
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  issued: 'Issued',
  paid: 'Paid',
  voided: 'Voided',
};

// Status color mappings for badges - vibrant & high contrast for all display panels
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold shadow-2xs dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-600',
  confirmed: 'bg-blue-100 text-blue-950 border border-blue-400 font-bold shadow-2xs dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-600',
  rescheduled: 'bg-orange-100 text-orange-950 border border-orange-400 font-bold shadow-2xs dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-600',
  checked_in: 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold shadow-2xs dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-600',
  completed: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold shadow-2xs dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-600',
  no_show: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold shadow-2xs dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-600',
  cancelled: 'bg-slate-200 text-slate-900 border border-slate-400 font-bold shadow-2xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
  expired: 'bg-zinc-200 text-zinc-900 border border-zinc-400 font-bold shadow-2xs dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  received: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold shadow-2xs',
  confirmed: 'bg-blue-100 text-blue-950 border border-blue-400 font-bold shadow-2xs',
  preparing: 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold shadow-2xs',
  ready: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold shadow-2xs',
  shipped: 'bg-purple-100 text-purple-950 border border-purple-400 font-bold shadow-2xs',
  delivered: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold shadow-2xs',
  picked_up: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold shadow-2xs',
  completed: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold shadow-2xs',
  cancelled: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold shadow-2xs',
};

// Navigation items for public website
export const PUBLIC_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Treatments', href: '/treatments' },
  { label: 'Products', href: '/products' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
] as const;

// Dashboard navigation structure
export const DASHBOARD_NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Appointments', href: '/dashboard/appointments', icon: 'Calendar' },
      { label: 'POS', href: '/dashboard/pos', icon: 'ShoppingCart' },
      { label: 'Orders', href: '/dashboard/orders', icon: 'Package' },
    ],
  },
  {
    label: 'Patients',
    items: [
      { label: 'Patients', href: '/dashboard/patients', icon: 'Users' },
    ],
  },
  {
    label: 'Financial',
    items: [
      { label: 'Invoices', href: '/dashboard/invoices', icon: 'FileText' },
      { label: 'Inventory', href: '/dashboard/inventory', icon: 'Warehouse' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Treatments', href: '/dashboard/content/treatments', icon: 'Stethoscope' },
      { label: 'Products', href: '/dashboard/content/products', icon: 'Box' },
      { label: 'Gallery', href: '/dashboard/gallery', icon: 'Image' },
      { label: 'Reviews', href: '/dashboard/reviews', icon: 'Star' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: 'BarChart3', adminOnly: true },
      { label: 'Settings', href: '/dashboard/settings', icon: 'Settings', adminOnly: true },
    ],
  },
] as const;
