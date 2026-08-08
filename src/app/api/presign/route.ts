import { NextResponse } from 'next/server';
import { supabaseServer, isSupabaseLive } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/presign
 * Ensures the 'call-recordings' bucket exists and returns its name.
 * The browser uploads directly to Supabase Storage using the anon client.
 */
export async function POST() {
  if (!isSupabaseLive()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    // Ensure bucket exists (idempotent)
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'call-recordings');

    if (!bucketExists) {
      const { error: createErr } = await supabaseServer.storage.createBucket('call-recordings', {
        public: true,           // public so server can download without signed URL
        fileSizeLimit: 104857600, // 100 MB limit
        allowedMimeTypes: ['audio/*', 'video/mp4'],
      });
      if (createErr && !createErr.message.includes('already exists')) {
        console.warn('[Presign] Bucket create warning:', createErr.message);
      }
    }

    return NextResponse.json({ bucket: 'call-recordings', ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Presign failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
