import { NextRequest } from 'next/server';
import { buildPlacePhotoUrl } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');
    const maxWidth = Number(searchParams.get('w') || 800);
    if (!ref) return new Response('Missing ref', { status: 400 });

    const url = buildPlacePhotoUrl(ref, maxWidth);
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    return new Response(buf, { status: 200, headers: { 'content-type': contentType, 'cache-control': 'public, max-age=86400' } });
  } catch (e: any) {
    return new Response('Failed to fetch photo', { status: 500 });
  }
}