'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  reviewSubmissionSchema,
  contactFormSchema,
  stockAdjustmentSchema,
  treatmentSchema,
  productSchema,
} from '@/lib/validations';
import { revalidatePath } from 'next/cache';

// ============================================================
// Public: Submit Review (Guest)
// ============================================================

export async function submitReview(formData: unknown) {
  const parsed = reviewSubmissionSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Honeypot check
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Bot detected — silently succeed
    return { success: true };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('reviews').insert({
    reviewer_name: parsed.data.reviewer_name,
    rating: parsed.data.rating,
    review_text: parsed.data.review_text,
    treatment_id: parsed.data.treatment_id || null,
    status: 'pending',
  });

  if (error) {
    console.error('[Review] Submit failed:', error);
    return { success: false, error: 'Failed to submit review.' };
  }

  return { success: true };
}

// ============================================================
// Public: Submit Contact Form (Guest)
// ============================================================

export async function submitContactForm(formData: unknown) {
  const parsed = contactFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('contact_submissions').insert({
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
  });

  if (error) {
    console.error('[Contact] Submit failed:', error);
    return { success: false, error: 'Failed to submit message.' };
  }

  return { success: true };
}

// ============================================================
// Dashboard: Moderate Review
// ============================================================

export async function moderateReview(
  reviewId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  const { error } = await supabase
    .from('reviews')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      moderated_at: new Date().toISOString(),
      moderated_by: staff.id,
      rejection_reason: action === 'reject' ? rejectionReason || null : null,
    })
    .eq('id', reviewId);

  if (error) return { success: false, error: 'Failed to moderate review.' };

  revalidatePath('/dashboard/reviews');
  revalidatePath('/reviews');
  return { success: true };
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete reviews.' };
  }

  const { error } = await supabase
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) return { success: false, error: 'Failed to delete review.' };

  revalidatePath('/dashboard/reviews');
  revalidatePath('/reviews');
  return { success: true };
}

// ============================================================
// Dashboard: Stock Adjustment
// ============================================================

export async function adjustStock(formData: unknown) {
  const parsed = stockAdjustmentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Only admin can adjust stock
  if (staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can adjust stock.' };
  }

  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity, name')
    .eq('id', parsed.data.product_id)
    .single();

  if (!product) return { success: false, error: 'Product not found.' };

  const newStock = product.stock_quantity + parsed.data.quantity;
  if (newStock < 0) {
    return { success: false, error: `Cannot reduce stock below 0. Current: ${product.stock_quantity}` };
  }

  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', parsed.data.product_id);

  if (error) return { success: false, error: 'Failed to adjust stock.' };

  await supabase.from('stock_movements').insert({
    product_id: parsed.data.product_id,
    movement_type: parsed.data.movement_type,
    quantity: parsed.data.quantity,
    quantity_before: product.stock_quantity,
    quantity_after: newStock,
    reason: parsed.data.reason,
    created_by: staff.id,
  });

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'product',
    entity_id: parsed.data.product_id,
    description: `Stock adjusted: ${parsed.data.quantity > 0 ? '+' : ''}${parsed.data.quantity} (${parsed.data.movement_type}). ${parsed.data.reason}`,
    old_values: { stock_quantity: product.stock_quantity },
    new_values: { stock_quantity: newStock },
  });

  revalidatePath('/dashboard/inventory');
  return { success: true };
}

// ============================================================
// Dashboard: Create/Update Treatment (Admin)
// ============================================================

export async function saveTreatment(treatmentId: string | null, formData: unknown) {
  const parsed = treatmentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can manage treatments.' };
  }

  const payload = {
    ...parsed.data,
    description: parsed.data.description || null,
    short_description: parsed.data.short_description || null,
    price_label: parsed.data.price_label || null,
    image_url: parsed.data.image_url || null,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    updated_by: staff.id,
  };

  if (treatmentId) {
    const { error } = await supabase
      .from('treatments')
      .update(payload)
      .eq('id', treatmentId);

    if (error) return { success: false, error: 'Failed to update treatment.' };
  } else {
    const { error } = await supabase
      .from('treatments')
      .insert({ ...payload, created_by: staff.id });

    if (error) {
      if (error.code === '23505') return { success: false, error: 'A treatment with this slug already exists.' };
      return { success: false, error: 'Failed to create treatment.' };
    }
  }

  revalidatePath('/dashboard/content/treatments');
  revalidatePath('/treatments');
  return { success: true };
}

// ============================================================
// Dashboard: Delete Treatment (Admin - Soft Delete)
// ============================================================

export async function deleteTreatment(treatmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete treatments.' };
  }

  const { error } = await supabase
    .from('treatments')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      updated_by: staff.id,
    })
    .eq('id', treatmentId);

  if (error) {
    console.error('[Treatment] Delete failed:', error);
    return { success: false, error: 'Failed to delete treatment.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'treatment',
    entity_id: treatmentId,
    description: 'Treatment soft-deleted',
  });

  revalidatePath('/dashboard/content/treatments');
  revalidatePath('/treatments');
  return { success: true };
}

// ============================================================
// Dashboard: Create/Update Product (Admin)
// ============================================================

export async function saveProduct(productId: string | null, formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can manage products.' };
  }

  const payload = {
    ...parsed.data,
    description: parsed.data.description || null,
    short_description: parsed.data.short_description || null,
    image_url: parsed.data.image_url || null,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    expiry_date: parsed.data.expiry_date || null,
    updated_by: staff.id,
  };

  if (productId) {
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId);

    if (error) return { success: false, error: 'Failed to update product.' };
  } else {
    const { data: product, error } = await supabase
      .from('products')
      .insert({ ...payload, created_by: staff.id })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'A product with this slug or SKU already exists.' };
      return { success: false, error: 'Failed to create product.' };
    }

    // Create initial stock movement
    if (product && parsed.data.stock_quantity > 0) {
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        movement_type: 'initial',
        quantity: parsed.data.stock_quantity,
        quantity_before: 0,
        quantity_after: parsed.data.stock_quantity,
        reason: 'Initial stock on product creation',
        created_by: staff.id,
      });
    }
  }

  revalidatePath('/dashboard/content/products');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/products');
  return { success: true };
}

// ============================================================
// Dashboard: Delete Product (Admin - Soft Delete)
// ============================================================

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete products.' };
  }

  const { error } = await supabase
    .from('products')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      is_published: false,
      updated_by: staff.id,
    })
    .eq('id', productId);

  if (error) {
    console.error('[Product] Delete failed:', error);
    return { success: false, error: 'Failed to delete product.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'product',
    entity_id: productId,
    description: 'Product soft-deleted',
  });

  revalidatePath('/dashboard/content/products');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/products');
  return { success: true };
}
