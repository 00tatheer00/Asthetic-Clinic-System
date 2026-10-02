import { NextRequest, NextResponse } from 'next/server';
import { uploadClinicImage } from '@/actions/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadClinicImage(formData);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /upload error:', err);
    return NextResponse.json({ error: err?.message || 'Server error during upload' }, { status: 500 });
  }
}
