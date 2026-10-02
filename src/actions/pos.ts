'use server';

import { createClient } from '@/lib/supabase/server';
import { saleSchema } from '@/lib/validations';
import { calculateDiscount, calculateTax, calculateLineTotal } from '@/lib/utils/helpers';
import { revalidatePath } from 'next/cache';

// ============================================================
// Create POS Sale (Dashboard only)
// ============================================================

export async function createSale(formData: unknown) {
  const parsed = saleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Check idempotency
  if (data.idempotency_key) {
    const { data: existingSale } = await supabase
      .from('sales')
      .select('id')
      .eq('idempotency_key', data.idempotency_key)
      .single();

    if (existingSale) {
      return { success: true, saleId: existingSale.id, duplicate: true };
    }
  }

  // Calculate line items server-side
  const saleItems: Array<{
    product_id: string | null;
    treatment_id: string | null;
    item_type: string;
    name: string;
    quantity: number;
    unit_price: number;
    discount_type: string | null;
    discount_value: number;
    discount_amount: number;
    line_total: number;
  }> = [];

  let subtotal = 0;

  for (const item of data.items) {
    let verifiedUnitPrice = item.unit_price;

    // Validate stock and verify price for product items
    if (item.item_type === 'product' && item.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, stock_quantity, reserved_quantity, name, sale_price')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        return { success: false, error: `Product not found: ${item.name}` };
      }

      const availableStock = product.stock_quantity - product.reserved_quantity;
      if (availableStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${availableStock}`,
        };
      }

      verifiedUnitPrice = Number(product.sale_price);
    }

    // Verify price for treatment/service items
    if (item.item_type === 'service' && item.treatment_id) {
      const { data: treatment } = await supabase
        .from('treatments')
        .select('id, price, name, is_active')
        .eq('id', item.treatment_id)
        .single();

      if (!treatment) {
        return { success: false, error: `Treatment not found: ${item.name}` };
      }

      verifiedUnitPrice = Number(treatment.price);
    }

    const itemDiscount = calculateDiscount(
      verifiedUnitPrice * item.quantity,
      item.discount_type,
      item.discount_value
    );
    const lineTotal = calculateLineTotal(
      verifiedUnitPrice,
      item.quantity,
      item.discount_type,
      item.discount_value
    );

    subtotal += lineTotal;

    saleItems.push({
      product_id: item.product_id || null,
      treatment_id: item.treatment_id || null,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity,
      unit_price: verifiedUnitPrice,
      discount_type: item.discount_type || null,
      discount_value: item.discount_value,
      discount_amount: itemDiscount,
      line_total: lineTotal,
    });
  }

  // Calculate sale-level totals
  const saleDiscount = calculateDiscount(subtotal, data.discount_type, data.discount_value);
  const afterDiscount = subtotal - saleDiscount;
  const taxAmount = calculateTax(afterDiscount, data.tax_rate);
  const total = afterDiscount + taxAmount;

  // Calculate change for cash
  let changeAmount: number | null = null;
  if (data.payment_method === 'cash' && data.amount_received) {
    changeAmount = Math.max(0, data.amount_received - total);
  }

  // Create sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      patient_id: data.patient_id || null,
      staff_id: staff.id,
      customer_name: data.customer_name || null,
      subtotal,
      discount_type: data.discount_type || null,
      discount_value: data.discount_value,
      discount_amount: saleDiscount,
      tax_rate: data.tax_rate,
      tax_amount: taxAmount,
      total,
      payment_method: data.payment_method,
      payment_status: 'paid',
      amount_received: data.amount_received || null,
      change_amount: changeAmount,
      idempotency_key: data.idempotency_key,
    })
    .select('id')
    .single();

  if (saleError || !sale) {
    console.error('[POS] Sale create failed:', saleError);
    return { success: false, error: 'Failed to create sale.' };
  }

  // Insert sale items
  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems.map((item) => ({ ...item, sale_id: sale.id })));

  if (itemsError) {
    console.error('[POS] Sale items insert failed:', itemsError);
  }

  // Deduct stock immediately for product items (POS = immediate deduction)
  for (const item of data.items) {
    if (item.item_type === 'product' && item.product_id) {
      // Try atomic RPC first to prevent concurrency race conditions
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('atomic_deduct_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
        p_movement_type: 'sale',
        p_reference_type: 'sale',
        p_reference_id: sale.id,
        p_reason: 'POS sale',
        p_staff_id: staff.id,
      });

      // Fallback if migration 003 RPC is not yet applied
      if (rpcErr || !(rpcRes as { success?: boolean })?.success) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = Math.max(0, product.stock_quantity - item.quantity);
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            movement_type: 'sale',
            quantity: -item.quantity,
            quantity_before: product.stock_quantity,
            quantity_after: newStock,
            reference_type: 'sale',
            reference_id: sale.id,
            reason: 'POS sale',
            created_by: staff.id,
          });
        }
      }
    }
  }

  // Generate invoice
  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single();

  const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

  let finalInvoiceNumber = invoiceNumber;
  if (!finalInvoiceNumber) {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    finalInvoiceNumber = `INV-${year}-${Date.now().toString().slice(-4)}${rand}`;
  }

  let createdInvoiceId: string | null = null;
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      invoice_number: finalInvoiceNumber,
      sale_id: sale.id,
      patient_id: data.patient_id || null,
      customer_name: data.customer_name || 'Walk-in Customer',
      clinic_name: settings?.clinic_name || 'Brimish Skin Care & Laser Clinic',
      clinic_address: settings?.clinic_address || 'Sami Tower, Ring Road, Peshawar, KP, Pakistan',
      clinic_phone: settings?.clinic_phone || '0335-6400959',
      clinic_email: settings?.clinic_email || null,
      clinic_ntn: settings?.ntn || null,
      clinic_strn: settings?.strn || null,
      subtotal,
      discount_amount: saleDiscount,
      tax_label: settings?.default_tax_label || 'GST',
      tax_rate: data.tax_rate,
      tax_amount: taxAmount,
      total,
      payment_method: data.payment_method,
      payment_status: 'paid',
      status: 'paid',
      paid_at: new Date().toISOString(),
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (invErr) {
    console.error('[POS] Invoice insert failed:', invErr);
  } else if (invoice) {
    createdInvoiceId = invoice.id;
    await supabase
      .from('invoice_line_items')
      .insert(
        saleItems.map((item, index) => ({
          invoice_id: invoice.id,
          description: `${item.name}${item.item_type === 'service' ? ' (Service)' : ''}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          line_total: item.line_total,
          sort_order: index,
        }))
      );
  }

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'sale',
    entity_id: sale.id,
    description: `POS sale created: total ${total}`,
  });

  revalidatePath('/dashboard/pos');
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/inventory');

  return { success: true, saleId: sale.id, invoiceId: createdInvoiceId, invoiceNumber: finalInvoiceNumber };
}

// ============================================================
// Void Sale (Admin Only)
// ============================================================

export async function voidSale(saleId: string, reason: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can void sales.' };
  }

  // Get sale with items
  const { data: sale } = await supabase
    .from('sales')
    .select('*, sale_items(product_id, quantity, item_type)')
    .eq('id', saleId)
    .single();

  if (!sale) return { success: false, error: 'Sale not found.' };
  if (sale.voided_at) return { success: false, error: 'Sale already voided.' };

  // Void the sale
  const { error } = await supabase
    .from('sales')
    .update({
      voided_at: new Date().toISOString(),
      voided_by: staff.id,
      void_reason: reason,
      payment_status: 'refunded',
    })
    .eq('id', saleId);

  if (error) return { success: false, error: 'Failed to void sale.' };

  // Return stock for product items
  for (const item of sale.sale_items || []) {
    if (item.item_type === 'product' && item.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = product.stock_quantity + item.quantity;
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);

        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          movement_type: 'return',
          quantity: item.quantity,
          quantity_before: product.stock_quantity,
          quantity_after: newStock,
          reference_type: 'sale',
          reference_id: saleId,
          reason: `Sale voided: ${reason}`,
          created_by: staff.id,
        });
      }
    }
  }

  // Void associated invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('sale_id', saleId)
    .single();

  if (invoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: staff.id,
        void_reason: reason,
      })
      .eq('id', invoice.id);
  }

  // Audit
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'void',
    entity_type: 'sale',
    entity_id: saleId,
    description: `Sale voided: ${reason}`,
  });

  revalidatePath('/dashboard/pos');
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/inventory');

  return { success: true };
}
