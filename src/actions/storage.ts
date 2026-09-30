'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

// Max file sizes in bytes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CLINICAL_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export type StorageCategory = 'treatments' | 'products' | 'before-after' | 'clinic-assets';

const BUCKET_MAP: Record<StorageCategory, string> = {
  treatments: 'treatment-images',
  products: 'product-images',
  'before-after': 'before-after-images',
  'clinic-assets': 'clinic-assets',
};

export async function uploadClinicImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  // 1. Authenticate Staff
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Staff session required.' };
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || !staff.is_active) {
    return { success: false, error: 'Forbidden: Active staff account required.' };
  }

  // 2. Validate File & Category
  const file = formData.get('file') as File | null;
  const category = (formData.get('category') as StorageCategory) || 'clinic-assets';

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  const bucketName = BUCKET_MAP[category];
  if (!bucketName) {
    return { success: false, error: 'Invalid storage category specified.' };
  }

  // 3. Validate MIME Type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Invalid file type "${file.type}". Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  // 4. Validate File Extension
  const originalName = file.name || 'image.jpg';
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      success: false,
      error: `Invalid file extension ".${extension}". Allowed extensions: .jpg, .jpeg, .png, .webp.`,
    };
  }

  // 5. Validate File Size
  const maxAllowed = category === 'before-after' ? MAX_CLINICAL_IMAGE_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxAllowed) {
    return {
      success: false,
      error: `File size exceeds the limit of ${maxAllowed / (1024 * 1024)}MB.`,
    };
  }

  // 6. Generate Secure Random Filename (Prevent Path Traversal & Collisions)
  const safeFilename = `${crypto.randomUUID()}.${extension}`;
  const filePath = `${category}/${safeFilename}`;

  // 7. Convert File to ArrayBuffer & Upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from(bucketName)
    .upload(safeFilename, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Storage] Upload error:', uploadError);
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // 8. Construct URL
  const { data: publicData } = adminClient.storage.from(bucketName).getPublicUrl(safeFilename);
  const finalUrl = publicData.publicUrl;

  // 9. Audit Log Entry
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'storage',
    description: `Uploaded ${category} media: ${safeFilename} (${file.size} bytes)`,
  });

  return { success: true, url: finalUrl };
}
