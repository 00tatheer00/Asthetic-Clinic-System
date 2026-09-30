import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const getFromEmail = () =>
  process.env.RESEND_FROM_EMAIL || 'Brimish Skin Care <noreply@brimishskincare.com>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function persistEmailLog(
  recipient: string,
  subject: string,
  status: 'sent' | 'failed' | 'mock',
  providerId?: string,
  errorMessage?: string
) {
  try {
    const admin = createAdminClient();
    await admin.from('email_logs').insert({
      recipient,
      subject,
      status,
      provider_id: providerId || null,
      error_message: errorMessage || null,
    });
  } catch {
    // Non-blocking: database logging failure must never crash email flow
  }
}

/**
 * Strip HTML tags to produce a clean plain-text fallback.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<th[^>]*>/gi, ' ')
    .replace(/<[^>]+>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

/**
 * Send an email via Resend. Non-blocking — logs failures and returns structured result without throwing.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  // If API key is not configured or placeholder in development/test, log and safely return
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    const mockId = `mock-${Date.now()}`;
    console.log(`[Email Mock/Dev] Would send to: ${options.to} | Subject: "${options.subject}"`);
    await persistEmailLog(options.to, options.subject, 'mock', mockId);
    return { success: true, messageId: mockId };
  }

  try {
    const plainText = options.text || stripHtml(options.html);

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: plainText,
      replyTo: options.replyTo || 'support@brimishskincare.com',
    });

    if (error) {
      console.error('[Email] Resend API error:', error);
      await persistEmailLog(options.to, options.subject, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await persistEmailLog(options.to, options.subject, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email exception';
    console.error('[Email] Transport exception:', message);
    await persistEmailLog(options.to, options.subject, 'failed', undefined, message);
    return { success: false, error: message };
  }
}

// ============================================================
// Layout Wrapper
// ============================================================

function wrapEmailTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #ffe4e6; margin: 6px 0 0 0; font-size: 13px; }
    .content { padding: 32px 28px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .table-data { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table-data td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table-data th { padding: 10px 12px; border-bottom: 2px solid #e2e8f0; font-size: 13px; text-align: left; color: #475569; background: #f8fafc; }
    .btn { display: inline-block; background-color: #e11d48; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Brimish Skin Care Clinic</h1>
      <p>Medical Aesthetics & Laser Center • Peshawar, Pakistan</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">Brimish Skin Care Clinic</p>
      <p style="margin: 0 0 8px 0;">University Road, Peshawar, Khyber Pakhtunkhwa, Pakistan</p>
      <p style="margin: 0;">Phone / WhatsApp: +92 300 0000000 • Email: info@brimishskincare.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================
// Appointment Email Templates
// ============================================================

export async function sendAppointmentReceivedEmail(data: {
  customerName: string;
  customerPhone: string;
  treatmentName: string;
  scheduledAt: string;
  message?: string;
}) {
  const adminEmail = process.env.CLINIC_ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = wrapEmailTemplate(
    'New Appointment Request',
    `
      <h2 style="color: #0f172a; margin-top: 0;">New Appointment Request</h2>
      <p style="font-size: 14px; color: #475569;">A patient has submitted an online appointment request:</p>
      <table class="table-data">
        <tr><td style="font-weight: 600; width: 140px;">Patient Name:</td><td>${data.customerName}</td></tr>
        <tr><td style="font-weight: 600;">Contact Phone:</td><td>${data.customerPhone}</td></tr>
        <tr><td style="font-weight: 600;">Procedure:</td><td>${data.treatmentName}</td></tr>
        <tr><td style="font-weight: 600;">Preferred Slot:</td><td>${data.scheduledAt}</td></tr>
        ${data.message ? `<tr><td style="font-weight: 600;">Notes:</td><td>${data.message}</td></tr>` : ''}
      </table>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/appointments" class="btn">Open Appointments Calendar</a>
      </div>
    `
  );

  return sendEmail({
    to: adminEmail,
    subject: `[Booking Request] ${data.customerName} — ${data.treatmentName}`,
    html,
  });
}

export async function sendAppointmentConfirmedEmail(data: {
  customerEmail: string;
  customerName: string;
  treatmentName: string;
  scheduledAt: string;
  clinicPhone?: string;
}) {
  const html = wrapEmailTemplate(
    'Appointment Confirmed',
    `
      <h2 style="color: #0f172a; margin-top: 0;">Your Appointment is Confirmed!</h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We are pleased to confirm your appointment at Brimish Skin Care Clinic. Here are your booking details:
      </p>
      <table class="table-data">
        <tr><td style="font-weight: 600; width: 140px;">Treatment:</td><td>${data.treatmentName}</td></tr>
        <tr><td style="font-weight: 600;">Date & Time:</td><td>${data.scheduledAt}</td></tr>
        <tr><td style="font-weight: 600;">Location:</td><td>Brimish Skin Care, University Road, Peshawar</td></tr>
      </table>
      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        <strong>Important Pre-Treatment Instructions:</strong><br>
        • Please arrive 10 minutes prior to your scheduled time.<br>
        • Avoid active exfoliating acids or retinol 48 hours before treatment.<br>
        • If you need to reschedule, please contact us at ${data.clinicPhone || '+92 300 0000000'}.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Appointment Confirmed — Brimish Skin Care Clinic`,
    html,
  });
}

export async function sendAppointmentReminderEmail(data: {
  customerEmail: string;
  customerName: string;
  treatmentName: string;
  scheduledAt: string;
  clinicPhone?: string;
}) {
  const html = wrapEmailTemplate(
    'Appointment Reminder',
    `
      <h2 style="color: #0f172a; margin-top: 0;">Appointment Reminder</h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        This is a friendly reminder that your clinical treatment is scheduled for tomorrow at Brimish Skin Care Clinic:
      </p>
      <table class="table-data">
        <tr><td style="font-weight: 600; width: 140px;">Treatment:</td><td>${data.treatmentName}</td></tr>
        <tr><td style="font-weight: 600;">Scheduled Time:</td><td>${data.scheduledAt}</td></tr>
      </table>
      <p style="font-size: 13px; color: #64748b;">
        We look forward to seeing you. Please call us at ${data.clinicPhone || '+92 300 0000000'} if you have any questions.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Appointment Reminder: Tomorrow at Brimish Skin Care`,
    html,
  });
}

export async function sendAppointmentStatusChangeEmail(data: {
  customerEmail: string;
  customerName: string;
  treatmentName: string;
  scheduledAt: string;
  status: 'rescheduled' | 'cancelled';
  reason?: string;
}) {
  const isRescheduled = data.status === 'rescheduled';
  const html = wrapEmailTemplate(
    isRescheduled ? 'Appointment Rescheduled' : 'Appointment Cancelled',
    `
      <h2 style="color: #0f172a; margin-top: 0;">
        ${isRescheduled ? 'Appointment Rescheduled' : 'Appointment Notice: Cancelled'}
      </h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        ${
          isRescheduled
            ? `Your appointment for <strong>${data.treatmentName}</strong> has been updated to:`
            : `Your appointment for <strong>${data.treatmentName}</strong> scheduled for ${data.scheduledAt} has been cancelled.`
        }
      </p>
      ${
        isRescheduled
          ? `
        <table class="table-data">
          <tr><td style="font-weight: 600; width: 140px;">Treatment:</td><td>${data.treatmentName}</td></tr>
          <tr><td style="font-weight: 600;">New Time:</td><td>${data.scheduledAt}</td></tr>
        </table>
      `
          : ''
      }
      ${data.reason ? `<p style="font-size: 13px; color: #64748b;">Reason / Note: ${data.reason}</p>` : ''}
      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        To book a new slot or contact reception, please call +92 300 0000000 or visit our website.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `${isRescheduled ? 'Rescheduled' : 'Cancelled'}: ${data.treatmentName} — Brimish Skin Care`,
    html,
  });
}

// ============================================================
// Order Email Templates
// ============================================================

export async function sendOrderConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  deliveryMethod: string;
}) {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr><td>${item.name}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:right;">Rs. ${item.price.toLocaleString()}</td></tr>`
    )
    .join('');

  const html = wrapEmailTemplate(
    `Order Confirmed — ${data.orderNumber}`,
    `
      <h2 style="color: #0f172a; margin-top: 0;">Thank You for Your Order!</h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">
        We have received your skincare order <strong>#${data.orderNumber}</strong>. Here is your order summary:
      </p>
      <table class="table-data">
        <thead>
          <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Line Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr style="border-top: 2px solid #0f172a; font-weight: bold;">
            <td colspan="2" style="font-size: 15px;">Grand Total</td>
            <td style="text-align:right; font-size: 15px;">Rs. ${data.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 13px; color: #64748b;">
        <strong>Delivery:</strong> ${data.deliveryMethod === 'pickup' ? 'Clinic Pickup (Peshawar)' : 'Cash on Delivery (Standard Shipping)'}<br>
        We will notify you by email as soon as your package is dispatched.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmation — #${data.orderNumber} (Brimish Skin Care)`,
    html,
  });
}

export async function sendOrderStatusEmail(data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
}) {
  const html = wrapEmailTemplate(
    `Order Update: ${data.orderNumber}`,
    `
      <h2 style="color: #0f172a; margin-top: 0;">Order Status Update</h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">
        Your order <strong>#${data.orderNumber}</strong> has been updated to:
      </p>
      <div style="background: #f1f5f9; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #e11d48; margin: 20px 0;">
        <span style="font-size: 16px; font-weight: bold; color: #0f172a;">Status: ${data.statusLabel}</span>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        If you have any questions regarding your delivery, please contact our support team.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Order Update — #${data.orderNumber} is now ${data.statusLabel}`,
    html,
  });
}

// ============================================================
// Invoice Email Template
// ============================================================

export async function sendInvoiceEmailTemplate(data: {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  items: Array<{ description: string; quantity: number; unit_price: number; line_total: number }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxLabel: string;
  taxRate: number;
  total: number;
  paymentMethod: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicNtn?: string | null;
  clinicStrn?: string | null;
}) {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr><td>${item.description}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:right;">Rs. ${item.unit_price.toLocaleString()}</td><td style="text-align:right;">Rs. ${item.line_total.toLocaleString()}</td></tr>`
    )
    .join('');

  const html = wrapEmailTemplate(
    `Official Tax Invoice — ${data.invoiceNumber}`,
    `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">Official Tax Invoice</h2>
        <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #e11d48;">${data.invoiceNumber}</span>
      </div>
      <p style="font-size: 15px; color: #334155;">Billed to: <strong>${data.customerName}</strong></p>
      <table class="table-data">
        <thead>
          <tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3" style="text-align:right; color:#64748b;">Subtotal</td><td style="text-align:right;">Rs. ${data.subtotal.toLocaleString()}</td></tr>
          ${data.discountAmount > 0 ? `<tr><td colspan="3" style="text-align:right; color:#16a34a;">Discount</td><td style="text-align:right; color:#16a34a;">-Rs. ${data.discountAmount.toLocaleString()}</td></tr>` : ''}
          ${data.taxAmount > 0 ? `<tr><td colspan="3" style="text-align:right; color:#64748b;">${data.taxLabel} (${data.taxRate}%)</td><td style="text-align:right;">Rs. ${data.taxAmount.toLocaleString()}</td></tr>` : ''}
          <tr style="border-top: 2px solid #0f172a; font-weight: bold;">
            <td colspan="3" style="text-align:right; font-size: 15px;">Grand Total</td>
            <td style="text-align:right; font-size: 15px;">Rs. ${data.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 13px; color: #64748b;">
        Payment Method: <strong>${data.paymentMethod.toUpperCase()}</strong> (Status: PAID)<br>
        ${data.clinicNtn ? `NTN: ${data.clinicNtn}` : ''} ${data.clinicStrn ? `| STRN: ${data.clinicStrn}` : ''}
      </p>
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px;">
        This is a computer-generated official receipt issued by Brimish Skin Care Clinic.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Official Invoice ${data.invoiceNumber} — Brimish Skin Care Clinic`,
    html,
  });
}

// ============================================================
// Review Request Template
// ============================================================

export async function sendReviewRequestEmail(data: {
  customerEmail: string;
  customerName: string;
  treatmentName: string;
}) {
  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reviews`;

  const html = wrapEmailTemplate(
    'How Was Your Treatment?',
    `
      <h2 style="color: #0f172a; margin-top: 0;">How Was Your Skin Care Experience?</h2>
      <p style="font-size: 15px; color: #334155;">Dear <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Thank you for visiting Brimish Skin Care Clinic for your <strong>${data.treatmentName}</strong> treatment. We hope your skin is feeling refreshed and radiant!
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your feedback helps us continuously elevate our aesthetic standards. Would you take 30 seconds to share your experience?
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${reviewUrl}" class="btn">Leave a Clinic Review</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        Your review will be verified by clinic staff before appearing on our patient testimonials page.
      </p>
    `
  );

  return sendEmail({
    to: data.customerEmail,
    subject: `Share Your Experience with Brimish Skin Care Clinic`,
    html,
  });
}

// ============================================================
// Low Stock Alert Template (Admin Only)
// ============================================================

export async function sendLowStockAlertEmail(
  products: Array<{ name: string; sku: string; stock: number; threshold: number }>
) {
  const adminEmail = process.env.CLINIC_ADMIN_EMAIL;
  if (!adminEmail) return;

  const rows = products
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${p.sku}</td><td style="color:#dc2626; font-weight:bold;">${p.stock}</td><td>${p.threshold}</td></tr>`
    )
    .join('');

  const html = wrapEmailTemplate(
    'Low Stock Alert',
    `
      <h2 style="color: #dc2626; margin-top: 0;">⚠️ Low Stock Inventory Alert</h2>
      <p style="font-size: 14px; color: #475569;">The following products are at or below their reorder threshold:</p>
      <table class="table-data">
        <thead>
          <tr><th>Product</th><th>SKU</th><th>Remaining Stock</th><th>Alert Threshold</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/inventory" class="btn">Open Inventory Manager</a>
      </div>
    `
  );

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ Low Stock Alert — ${products.length} product(s) need replenishment`,
    html,
  });
}
