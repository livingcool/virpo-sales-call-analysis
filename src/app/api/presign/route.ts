import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, isSupabaseLive } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/presign
 * Creates a signed upload URL so the browser can upload files directly to Supabase Storage
 * using server credentials (bypassing client-side missing env vars or RLS restrictions).
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseLive()) {
    return NextResponse.json({ error: 'Supabase server credentials not live' }, { status: 503 });
  }

  try {
    let filename = 'audio.mp3';
    try {
      const body = await req.json();
      if (body.filename) filename = body.filename;
    } catch {
      // JSON body optional
    }

    const storagePath = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // 1. Ensure bucket exists
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'call-recordings');

    if (!bucketExists) {
      const { error: createErr } = await supabaseServer.storage.createBucket('call-recordings', {
        public: true,
        fileSizeLimit: 104857600, // 100 MB limit
      });
      if (createErr && !createErr.message.includes('already exists')) {
        console.warn('[Presign] Bucket create warning:', createErr.message);
      }
    }

    // 2. Generate signed upload URL from server
    const { data: signedData, error: signedErr } = await supabaseServer.storage
      .from('call-recordings')
      .createSignedUploadUrl(storagePath);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (signedErr || !signedData) {
      console.warn('[Presign] Signed URL creation warning:', signedErr?.message);
      return NextResponse.json({
        ok: true,
        storagePath,
        signedUrl: null,
        token: null,
        supabaseUrl,
        supabaseAnonKey,
      });
    }

    return NextResponse.json({
      ok: true,
      storagePath,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      supabaseUrl,
      supabaseAnonKey,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Presign failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
