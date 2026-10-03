import { z } from 'zod';
import { PK_PHONE_REGEX } from '@/lib/constants';

// ============================================================
// Shared field schemas
// ============================================================

export const phoneSchema = z
  .string()
  .transform((val) => {
    let clean = val.replace(/[\s\-\(\)\.]/g, '');
    if (clean.startsWith('+92')) clean = '0' + clean.slice(3);
    else if (clean.startsWith('0092')) clean = '0' + clean.slice(4);
    else if (clean.startsWith('92')) clean = '0' + clean.slice(2);
    else if (/^3[0-9]{9}$/.test(clean)) clean = '0' + clean;
    return clean;
  })
  .pipe(
    z
      .string()
      .regex(
        /^03[0-9]{9}$/,
        'Enter a valid Pakistani mobile number (e.g., 03001234567 or +923143176526)'
      )
  );

export const emailSchema = z.string().email('Enter a valid email address');

export const optionalEmailSchema = z
  .string()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''));

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only');

export const monetarySchema = z
  .number()
  .nonnegative('Amount must be non-negative')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const ratingSchema = z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5');

// ============================================================
// Appointment Booking (Public)
// ============================================================

export const appointmentBookingSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  customer_phone: phoneSchema,
  whatsapp_number: z.string().optional().or(z.literal('')),
  customer_email: optionalEmailSchema,
  treatment_id: z.string().min(1, 'Select a treatment'),
  scheduled_at: z.string().datetime({ message: 'Select a valid date and time' }),
  message: z
    .string()
    .max(1000, 'Message must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;

// ============================================================
// Appointment Management (Dashboard)
// ============================================================

export const appointmentUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'rescheduled',
    'checked_in',
    'completed',
    'no_show',
    'cancelled',
    'expired',
  ]),
  scheduled_at: z.string().datetime().optional(),
  cancellation_reason: z.string().max(500).optional(),
  patient_id: z.string().uuid().optional().nullable(),
});

export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

// ============================================================
// Patient Registration
// ============================================================

export const patientSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  phone: phoneSchema,
  email: optionalEmailSchema,
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  date_of_birth: z.string().date().optional().nullable(),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type PatientInput = z.infer<typeof patientSchema>;

// ============================================================
// Clinical Notes (Doctor Only)
// ============================================================

export const clinicalNoteSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional().nullable(),
  appointment_id: z.string().uuid().optional().nullable(),
  note_text: z.string().min(1, 'Clinical note is required').max(10000),
  diagnosis: z.string().max(2000).optional().or(z.literal('')),
  prescription: z.string().max(5000).optional().or(z.literal('')),
});

export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;

// ============================================================
// Treatment CMS
// ============================================================

export const treatmentSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  slug: slugSchema,
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(10000).optional().or(z.literal('')),
  short_description: z.string().max(300).optional().or(z.literal('')),
  price: monetarySchema.optional().nullable(),
  price_label: z.string().max(50).optional().or(z.literal('')),
  duration_minutes: z.number().int().positive().optional().nullable(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
});

export type TreatmentInput = z.infer<typeof treatmentSchema>;

export const treatmentCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: slugSchema,
  description: z.string().max(500).optional().or(z.literal('')),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type TreatmentCategoryInput = z.infer<typeof treatmentCategorySchema>;

// ============================================================
// Product / Inventory
// ============================================================

export const productSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  slug: slugSchema,
  sku: z.string().min(1).max(50).trim(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(10000).optional().or(z.literal('')),
  short_description: z.string().max(300).optional().or(z.literal('')),
  purchase_price: monetarySchema,
  sale_price: monetarySchema.refine((val) => val > 0, 'Sale price must be greater than 0'),
  stock_quantity: z.number().int().nonnegative().default(0),
  low_stock_threshold: z.number().int().nonnegative().default(5),
  expiry_date: z.string().date().optional().nullable(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean().default(false),
  is_active: z.boolean().default(true),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  sort_order: z.number().int().default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

export const productCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: slugSchema,
  description: z.string().max(500).optional().or(z.literal('')),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ProductCategoryInput = z.infer<typeof productCategorySchema>;

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().refine((val) => val !== 0, 'Quantity cannot be zero'),
  movement_type: z.enum(['purchase', 'adjustment', 'correction', 'return']),
  reason: z.string().min(1, 'Reason is required').max(500),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// ============================================================
// POS Sale
// ============================================================

const saleItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  treatment_id: z.string().uuid().optional().nullable(),
  item_type: z.enum(['product', 'service']),
  name: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unit_price: monetarySchema,
  discount_type: z.enum(['percentage', 'fixed']).optional().nullable(),
  discount_value: z.number().nonnegative().default(0),
});

export const saleSchema = z.object({
  patient_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().max(100).optional().or(z.literal('')),
  customer_phone: z.string().max(30).optional().nullable().or(z.literal('')),
  items: z.array(saleItemSchema).min(1, 'Add at least one item'),
  discount_type: z.enum(['percentage', 'fixed']).optional().nullable(),
  discount_value: z.number().nonnegative().default(0),
  tax_rate: z.number().nonnegative().max(100).default(0),
  payment_method: z.enum(['cash', 'card', 'bank_transfer']),
  amount_received: monetarySchema.optional().nullable(),
  idempotency_key: z.string().min(1),
});

export type SaleInput = z.infer<typeof saleSchema>;

// ============================================================
// Online Order (Guest Checkout)
// ============================================================

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const orderCheckoutSchema = z
  .object({
    customer_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100)
      .trim(),
    customer_phone: phoneSchema,
    customer_email: optionalEmailSchema,
    delivery_method: z.enum(['pickup', 'delivery']),
    delivery_address: z.string().max(500).optional().or(z.literal('')),
    delivery_city: z.string().max(100).optional().or(z.literal('')),
    delivery_notes: z.string().max(500).optional().or(z.literal('')),
    items: z.array(orderItemSchema).min(1, 'Cart is empty'),
  })
  .refine(
    (data) => {
      if (data.delivery_method === 'delivery') {
        return !!data.delivery_address && data.delivery_address.length >= 5;
      }
      return true;
    },
    {
      message: 'Delivery address is required for delivery orders',
      path: ['delivery_address'],
    }
  );

export type OrderCheckoutInput = z.infer<typeof orderCheckoutSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'received',
    'confirmed',
    'preparing',
    'ready',
    'shipped',
    'delivered',
    'picked_up',
    'completed',
    'cancelled',
  ]),
  cancellation_reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// ============================================================
// Review Submission
// ============================================================

export const reviewSubmissionSchema = z.object({
  reviewer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),
  rating: ratingSchema,
  review_text: z
    .string()
    .min(3, 'Review must be at least 3 characters')
    .max(2000, 'Review must be at most 2000 characters')
    .trim(),
  treatment_id: z.string().optional().or(z.literal('')),
  // Honeypot field — must be empty
  website: z.string().max(0, 'Invalid submission').optional().or(z.literal('')),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

// ============================================================
// Contact Form
// ============================================================

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),
  email: optionalEmailSchema,
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().max(200).optional().or(z.literal('')),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters')
    .trim(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================================
// Clinic Settings
// ============================================================

export const clinicSettingsSchema = z.object({
  clinic_name: z.string().min(1).max(200).trim(),
  clinic_address: z.string().max(500).optional().or(z.literal('')),
  clinic_city: z.string().max(100).default('Peshawar'),
  clinic_phone: z.string().max(20).optional().or(z.literal('')),
  clinic_email: optionalEmailSchema,
  clinic_website: z.string().url().optional().or(z.literal('')),
  ntn: z.string().max(50).optional().or(z.literal('')),
  strn: z.string().max(50).optional().or(z.literal('')),
  default_tax_rate: z.number().nonnegative().max(100).default(0),
  default_tax_label: z.string().max(50).default('GST'),
  google_maps_embed: z.string().max(2000).optional().or(z.literal('')),
  social_facebook: z.string().url().optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
  social_whatsapp: z.string().max(20).optional().or(z.literal('')),
});

export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>;

// ============================================================
// Operating Hours
// ============================================================

export const operatingHoursSchema = z.object({
  hours: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      open_time: z.string().optional().nullable(),
      close_time: z.string().optional().nullable(),
      is_closed: z.boolean(),
    })
  ),
});

export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;

// ============================================================
// Staff Management
// ============================================================

export const staffSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: emailSchema,
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.enum(['super_admin', 'receptionist']),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

export type StaffInput = z.infer<typeof staffSchema>;

// ============================================================
// Before/After Gallery
// ============================================================

export const beforeAfterSchema = z.object({
  patient_id: z.string().uuid().optional().nullable(),
  treatment_id: z.string().uuid().optional().nullable(),
  visit_id: z.string().uuid().optional().nullable(),
  title: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  before_image_url: z.string().url('Before image is required'),
  after_image_url: z.string().url('After image is required'),
  is_public: z.boolean().default(false),
});

export type BeforeAfterInput = z.infer<typeof beforeAfterSchema>;

export const consentRecordSchema = z.object({
  before_after_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  consent_status: z.enum(['pending', 'given', 'revoked']),
  consent_notes: z.string().max(1000).optional().or(z.literal('')),
});

export type ConsentRecordInput = z.infer<typeof consentRecordSchema>;

// ============================================================
// Invoice Void
// ============================================================

export const invoiceVoidSchema = z.object({
  void_reason: z.string().min(1, 'Reason is required').max(500),
});

export type InvoiceVoidInput = z.infer<typeof invoiceVoidSchema>;

// ============================================================
// Login
// ============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
