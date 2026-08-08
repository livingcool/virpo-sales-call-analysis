import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export interface HealthResult {
  supabase: boolean;
  storage: boolean;
  project_ref: string;
  latency_ms: number;
  error?: string;
  storage_error?: string;
}

/**
 * GET /api/health
 * Performs a live connectivity check against Supabase:
 *  - DB: simple SELECT 1 query on the calls table
 *  - Storage: list buckets
 * Returns structured JSON with status + latency.
 */
export async function GET() {
  const start = Date.now();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnqxuxuhfugowutamvlk.supabase.co';
  const projectRef = rawUrl.replace('https://', '').split('.')[0] || 'dnqxuxuhfugowutamvlk';

  let dbOk = false;
  let storageOk = false;
  let dbError: string | undefined;
  let storageError: string | undefined;

  // DB check — lightweight table presence probe
  try {
    const { error } = await supabaseServer
      .from('calls')
      .select('id')
      .limit(1);

    if (!error) {
      dbOk = true;
    } else {
      if (error.message.includes('permission denied') || error.code === '42501') {
        dbError = 'Schema tables missing permissions. Run supabase_schema.sql in Supabase SQL Editor.';
      } else if (error.message.includes('relation "public.calls" does not exist') || error.code === '42P01') {
        dbError = 'Calls table missing. Run supabase_schema.sql in Supabase SQL Editor.';
      } else {
        dbError = error.message;
      }
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : 'DB probe failed';
  }

  // Storage check — list buckets
  try {
    const { data, error } = await supabaseServer.storage.listBuckets();
    if (!error && data !== null) {
      storageOk = true;
    } else {
      storageError = error?.message || 'Could not list buckets';
    }
  } catch (e) {
    storageError = e instanceof Error ? e.message : 'Storage probe failed';
  }

  const latency = Date.now() - start;

  return NextResponse.json<HealthResult>({
    supabase: dbOk,
    storage: storageOk,
    project_ref: projectRef,
    latency_ms: latency,
    ...(dbError ? { error: dbError } : {}),
    ...(storageError ? { storage_error: storageError } : {}),
  });
}
