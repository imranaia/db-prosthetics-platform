import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'db-prosthetics/site';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadImage(buffer, folder);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[upload] Cloudinary error:', message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
