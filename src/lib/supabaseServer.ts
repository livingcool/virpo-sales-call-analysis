import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://dnqxuxuhfugowutamvlk.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucXh1eHVoZnVnb3d1dGFtdmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjY2NTUsImV4cCI6MjA4MDE0MjY1NX0.zOe3WQRyq0yV_Aseoi_9qESB0g3rfKZJFrvDwsjQYyw';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  DEFAULT_ANON_KEY;

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export function isSupabaseLive(): boolean {
  return true;
}
