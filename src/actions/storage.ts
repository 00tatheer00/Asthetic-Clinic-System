'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

// Max file sizes in bytes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

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
  provider?: 'cloudinary' | 'supabase';
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

  // 3. Validate MIME Type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Invalid file type "${file.type}". Allowed formats: JPEG, PNG, WebP, GIF.`,
    };
  }

  // 4. Validate File Size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `File size exceeds the limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  // 5. Generate Filename
  const originalName = file.name || 'image.jpg';
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeFilename = `${crypto.randomUUID()}.${extension}`;

  // 6. Read File Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 7. Attempt Cloudinary Upload if credentials exist
  if (cloudName && apiKey && apiSecret) {
    try {
      const cloudinaryResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `brimish/${category}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error || new Error('Cloudinary upload returned empty response'));
            } else {
              resolve(result as { secure_url: string });
            }
          }
        );
        uploadStream.end(buffer);
      });

      if (cloudinaryResult?.secure_url) {
        await supabase.from('audit_log').insert({
          staff_id: staff.id,
          action: 'create',
          entity_type: 'storage',
          description: `Uploaded ${category} media to Cloudinary: ${safeFilename} (${file.size} bytes)`,
        });

        return {
          success: true,
          url: cloudinaryResult.secure_url,
          provider: 'cloudinary',
        };
      }
    } catch (cErr: any) {
      console.warn('[Cloudinary] Upload failed, falling back to Supabase Storage:', cErr?.message || cErr);
    }
  }

  // 8. Fallback to Supabase Storage
  const bucketName = BUCKET_MAP[category] || 'clinic-assets';
  const adminClient = createAdminClient();

  // Try uploading to bucket
  const { error: uploadError } = await adminClient.storage
    .from(bucketName)
    .upload(safeFilename, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (!uploadError) {
    const { data: publicData } = adminClient.storage.from(bucketName).getPublicUrl(safeFilename);
    const finalUrl = publicData.publicUrl;

    await supabase.from('audit_log').insert({
      staff_id: staff.id,
      action: 'create',
      entity_type: 'storage',
      description: `Uploaded ${category} media to Supabase: ${safeFilename} (${file.size} bytes)`,
    });

    return { success: true, url: finalUrl, provider: 'supabase' };
  }

  // 9. If both Cloudinary & Supabase storage bucket fails:
  console.warn('[Storage] Supabase bucket upload failed:', uploadError.message);

  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: `Storage upload failed: ${uploadError.message}. Please configure Cloudinary or create the Supabase storage bucket.`,
    };
  }

  // In development, fallback to inline data URI for seamless local testing
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  return {
    success: true,
    url: dataUri,
    error: 'Uploaded locally as data URI (dev fallback). Configure Cloudinary or Supabase Storage for production.',
  };
}
