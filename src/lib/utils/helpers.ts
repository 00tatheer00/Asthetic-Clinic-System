import { CURRENCY_SYMBOL, TIMEZONE } from '@/lib/constants';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// ============================================================
// Currency Formatting
// ============================================================

/**
 * Format a number as PKR currency.
 * @example formatCurrency(5000) → "Rs. 5,000"
 * @example formatCurrency(5000.5) → "Rs. 5,000.50"
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Format a number as plain currency without symbol.
 * @example formatAmount(5000) → "5,000"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================
// Date / Time Formatting (Asia/Karachi)
// ============================================================

/**
 * Convert a UTC date string to Asia/Karachi timezone and format.
 * @example formatDate('2026-10-01T10:00:00Z') → "01 Oct 2026"
 */
export function formatDate(dateString: string, formatStr: string = 'dd MMM yyyy'): string {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, formatStr);
}

/**
 * Format a date with time in Asia/Karachi timezone.
 * @example formatDateTime('2026-10-01T10:00:00Z') → "01 Oct 2026, 03:00 PM"
 */
export function formatDateTime(dateString: string): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

/**
 * Format a date as time only in Asia/Karachi timezone.
 * @example formatTime('2026-10-01T10:00:00Z') → "03:00 PM"
 */
export function formatTime(dateString: string): string {
  return formatDate(dateString, 'hh:mm a');
}

/**
 * Format a date as relative time.
 * @example formatRelativeTime('2026-09-30T10:00:00Z') → "1 day ago"
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Format a date for display in a short format.
 * @example formatShortDate('2026-10-01T10:00:00Z') → "Oct 1"
 */
export function formatShortDate(dateString: string): string {
  return formatDate(dateString, 'MMM d');
}

// ============================================================
// Phone Formatting
// ============================================================

/**
 * Format a Pakistani phone number for display.
 * @example formatPhone('03001234567') → '0300-1234567'
 */
export function formatPhone(phone: string): string {
  if (phone.length === 11 && phone.startsWith('03')) {
    return `${phone.slice(0, 4)}-${phone.slice(4)}`;
  }
  return phone;
}

// ============================================================
// String Utilities
// ============================================================

/**
 * Generate a URL-friendly slug from a string.
 * @example generateSlug('Gold Facial Treatment') → 'gold-facial-treatment'
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================================================
// Calculation Utilities
// ============================================================

/**
 * Calculate discount amount from discount type and value.
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed' | null | undefined,
  discountValue: number
): number {
  if (!discountType || discountValue <= 0) return 0;

  if (discountType === 'percentage') {
    return Math.round((subtotal * discountValue) / 100 * 100) / 100;
  }

  return Math.min(discountValue, subtotal);
}

/**
 * Calculate tax amount.
 */
export function calculateTax(amountAfterDiscount: number, taxRate: number): number {
  if (taxRate <= 0) return 0;
  return Math.round((amountAfterDiscount * taxRate) / 100 * 100) / 100;
}

/**
 * Calculate line item total.
 */
export function calculateLineTotal(
  unitPrice: number,
  quantity: number,
  discountType: 'percentage' | 'fixed' | null | undefined,
  discountValue: number
): number {
  const subtotal = unitPrice * quantity;
  const discount = calculateDiscount(subtotal, discountType, discountValue);
  return Math.round((subtotal - discount) * 100) / 100;
}

/**
 * Calculate available stock (stock - reserved).
 */
export function getAvailableStock(stockQuantity: number, reservedQuantity: number): number {
  return Math.max(0, stockQuantity - reservedQuantity);
}

// ============================================================
// ID Generation
// ============================================================

/**
 * Generate a client-side idempotency key for POS transactions.
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// Misc
// ============================================================

/**
 * Get initials from a name (for avatars).
 * @example getInitials('Brimish Skin Care') → 'BS'
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Convert string into a URL-friendly slug.
 * @example slugify('Carbon Laser Peel!') → 'carbon-laser-peel'
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Build search params string from an object.
 */
export function buildSearchParams(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}
