// Database enum types mirrored in TypeScript for type safety

export type UserRole = 'super_admin' | 'receptionist';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'checked_in'
  | 'completed'
  | 'no_show'
  | 'cancelled'
  | 'expired';

export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partially_refunded';

export type InvoiceStatus = 'issued' | 'paid' | 'voided';

export type DiscountType = 'percentage' | 'fixed';

export type StockMovementType =
  | 'initial'
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'return'
  | 'reservation'
  | 'reservation_release'
  | 'reservation_fulfillment'
  | 'correction';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type GenderType = 'male' | 'female' | 'other';

export type ConsentStatus = 'pending' | 'given' | 'revoked';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'void'
  | 'login'
  | 'logout'
  | 'export'
  | 'email_sent';

// ============================================================
// Database Row Types
// ============================================================

export interface Staff {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: GenderType | null;
  date_of_birth: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
}

export interface TreatmentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Treatment {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  // Joined
  category?: TreatmentCategory;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  short_description: string | null;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  image_url: string | null;
  is_published: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  // Joined
  category?: ProductCategory;
}

export interface Appointment {
  id: string;
  patient_id: string | null;
  treatment_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: AppointmentStatus;
  message: string | null;
  cancellation_reason: string | null;
  rescheduled_from: string | null;
  reminder_sent: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  // Joined
  patient?: Patient;
  treatment?: Treatment;
}

export interface Visit {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  treatment_id: string | null;
  visit_date: string;
  notes: string | null;
  sale_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  visit_id: string | null;
  appointment_id: string | null;
  note_text: string;
  diagnosis: string | null;
  prescription: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  deleted_at: string | null;
}

export interface Sale {
  id: string;
  patient_id: string | null;
  staff_id: string;
  customer_name: string | null;
  subtotal: number;
  discount_type: DiscountType | null;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount_received: number | null;
  change_amount: number | null;
  idempotency_key: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Patient;
  staff?: Staff;
  items?: SaleItem[];
  invoice?: Invoice;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  treatment_id: string | null;
  item_type: 'product' | 'service';
  name: string;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType | null;
  discount_value: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  patient_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_notes: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  fulfilled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined
  items?: OrderItem[];
  invoice?: Invoice;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sale_id: string | null;
  order_id: string | null;
  patient_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string | null;
  clinic_ntn: string | null;
  clinic_strn: string | null;
  subtotal: number;
  discount_amount: number;
  tax_label: string;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  status: InvoiceStatus;
  paid_at: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  credit_note_id: string | null;
  issued_at: string;
  created_at: string;
  created_by: string | null;
  // Joined
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface BeforeAfter {
  id: string;
  patient_id: string | null;
  treatment_id: string | null;
  visit_id: string | null;
  title: string | null;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  // Joined
  treatment?: Treatment;
  consent?: ConsentRecord;
}

export interface ConsentRecord {
  id: string;
  before_after_id: string;
  patient_id: string;
  consent_status: ConsentStatus;
  consent_given_at: string | null;
  consent_revoked_at: string | null;
  consent_notes: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  treatment_id: string | null;
  status: ReviewStatus;
  moderated_at: string | null;
  moderated_by: string | null;
  rejection_reason: string | null;
  ip_address: string | null;
  created_at: string;
  deleted_at: string | null;
  // Joined
  treatment?: Treatment;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  clinic_address: string | null;
  clinic_city: string;
  clinic_phone: string | null;
  clinic_email: string | null;
  clinic_website: string | null;
  ntn: string | null;
  strn: string | null;
  default_tax_rate: number;
  default_tax_label: string;
  currency_code: string;
  timezone: string;
  google_maps_embed: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_whatsapp: string | null;
  logo_url: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface OperatingHours {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AuditLog {
  id: string;
  staff_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  template_name: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  resend_id: string | null;
  error_message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  retry_count: number;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  ip_address: string | null;
  created_at: string;
}

// ============================================================
// Utility Types
// ============================================================

/** Cart item for client-side cart state (public product ordering) */
export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  available_stock: number;
}

/** POS cart item (dashboard POS terminal) */
export interface POSCartItem {
  id: string; // Temporary client-side ID
  product_id: string | null;
  treatment_id: string | null;
  item_type: 'product' | 'service';
  name: string;
  unit_price: number;
  quantity: number;
  discount_type: DiscountType | null;
  discount_value: number;
  discount_amount: number;
  line_total: number;
  available_stock?: number; // Only for products
}

/** Dashboard stats for overview page */
export interface DashboardStats {
  todayAppointments: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueToday?: number; // Admin only
  revenueThisMonth?: number; // Admin only
}

/** Pagination params */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API error response */
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/** Order status transition map */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'shipped', 'cancelled'],
  ready: ['picked_up', 'delivered', 'shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed'],
  picked_up: ['completed'],
  completed: [],
  cancelled: [],
};

/** Days of the week labels */
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
