'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { orderCheckoutSchema, orderStatusUpdateSchema } from '@/lib/validations';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '@/lib/email';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { VALID_ORDER_TRANSITIONS } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@/lib/types';

// ============================================================
// Public: Place Order (Guest, uses admin client)
// ============================================================

export async function placeOrder(formData: unknown) {
  const parsed = orderCheckoutSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Validate products and calculate totals
  const productIds = data.items.map((i) => i.product_id);
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name, sale_price, stock_quantity, reserved_quantity, is_active, is_published')
    .in('id', productIds)
    .is('deleted_at', null);

  if (productError || !products) {
    return { success: false, error: 'Failed to validate products.' };
  }

  // Verify all products exist and have stock
  const orderItems: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }> = [];

  let subtotal = 0;

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.product_id);
    if (!product || !product.is_active || !product.is_published) {
      return { success: false, error: `Product "${product?.name || item.product_id}" is not available.` };
    }

    const availableStock = product.stock_quantity - product.reserved_quantity;
    if (availableStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${product.name}". Available: ${availableStock}`,
      };
    }

    const lineTotal = product.sale_price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      product_id: product.id,
      name: product.name,
      quantity: item.quantity,
      unit_price: product.sale_price,
      line_total: lineTotal,
    });
  }

  // Get clinic settings for delivery fee and tax
  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('default_tax_rate')
    .limit(1)
    .single();

  const deliveryFee = data.delivery_method === 'delivery' ? 200 : 0; // Flat fee
  const taxRate = settings?.default_tax_rate || 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
  const total = subtotal + deliveryFee + taxAmount;

  // Generate order number
  const { data: orderNumber } = await supabase.rpc('generate_order_number');
  const finalOrderNumber =
    orderNumber ||
    `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: finalOrderNumber,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address || null,
      delivery_city: data.delivery_city || null,
      delivery_notes: data.delivery_notes || null,
      status: 'received',
      subtotal,
      delivery_fee: deliveryFee,
      tax_amount: taxAmount,
      total,
      payment_method: 'cash',
      payment_status: 'pending',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[Order] Create failed:', orderError);
    return { success: false, error: 'Failed to create order.' };
  }

  // Create order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    console.error('[Order] Items insert failed:', itemsError);
    // Order is created but items failed — log for manual fix
  }

  // Reserve stock for each product (atomic RPC with fallback)
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.product_id)!;

    // Try atomic RPC first to prevent race conditions
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('atomic_reserve_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
      p_order_id: order.id,
      p_reason: `Stock reserved for order ${finalOrderNumber}`,
    });

    if (rpcErr || !(rpcRes as { success?: boolean })?.success) {
      // Fallback
      await supabase
        .from('products')
        .update({ reserved_quantity: product.reserved_quantity + item.quantity })
        .eq('id', item.product_id);

      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        movement_type: 'reservation',
        quantity: item.quantity,
        quantity_before: product.stock_quantity,
        quantity_after: product.stock_quantity,
        reference_type: 'order',
        reference_id: order.id,
        reason: `Stock reserved for order ${finalOrderNumber}`,
      });
    }
  }

  // Send confirmation email (non-blocking)
  if (data.customer_email) {
    sendOrderConfirmationEmail({
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      orderNumber: finalOrderNumber,
      items: orderItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.line_total })),
      total,
      deliveryMethod: data.delivery_method,
    }).catch(console.error);
  }

  return { success: true, orderNumber: finalOrderNumber, orderId: order.id };
}

// ============================================================
// Dashboard: Update Order Status
// ============================================================

export async function updateOrderStatus(
  orderId: string,
  formData: unknown
) {
  const parsed = orderStatusUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed' };
  }

  const { status: newStatus, cancellation_reason } = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Get current order
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(product_id, quantity)')
    .eq('id', orderId)
    .single();

  if (!order) return { success: false, error: 'Order not found' };

  // Validate transition
  const allowed = (VALID_ORDER_TRANSITIONS as Record<string, string[]>)[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change from "${order.status}" to "${newStatus}".`,
    };
  }

  // Build update
  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancelled_by = staff.id;
    updateData.cancellation_reason = cancellation_reason || null;
  }

  if (['delivered', 'picked_up'].includes(newStatus)) {
    updateData.fulfilled_at = new Date().toISOString();
    updateData.payment_status = 'paid';
  }

  if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    return { success: false, error: 'Failed to update order.' };
  }

  // Handle stock changes on cancellation — release reserved stock
  if (newStatus === 'cancelled') {
    for (const item of order.order_items || []) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, reserved_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ reserved_quantity: Math.max(0, product.reserved_quantity - item.quantity) })
          .eq('id', item.product_id);

        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          movement_type: 'reservation_release',
          quantity: item.quantity,
          quantity_before: product.stock_quantity,
          quantity_after: product.stock_quantity,
          reference_type: 'order',
          reference_id: orderId,
          reason: `Reservation released — order cancelled`,
          created_by: staff.id,
        });
      }
    }
  }

  // Handle stock fulfillment — deduct actual stock on delivery/pickup
  if (['delivered', 'picked_up'].includes(newStatus)) {
    for (const item of order.order_items || []) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, reserved_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = product.stock_quantity - item.quantity;
        const newReserved = Math.max(0, product.reserved_quantity - item.quantity);

        await supabase
          .from('products')
          .update({ stock_quantity: newStock, reserved_quantity: newReserved })
          .eq('id', item.product_id);

        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          movement_type: 'reservation_fulfillment',
          quantity: -item.quantity,
          quantity_before: product.stock_quantity,
          quantity_after: newStock,
          reference_type: 'order',
          reference_id: orderId,
          reason: `Order fulfilled`,
          created_by: staff.id,
        });
      }
    }
  }

  // Send status email
  if (order.customer_email) {
    sendOrderStatusEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      status: newStatus,
      statusLabel: ORDER_STATUS_LABELS[newStatus] || newStatus,
    }).catch(console.error);
  }

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'order',
    entity_id: orderId,
    description: `Order ${order.order_number} status: ${order.status} → ${newStatus}`,
    old_values: { status: order.status },
    new_values: { status: newStatus },
  });

  revalidatePath('/dashboard/orders');
  return { success: true };
}
