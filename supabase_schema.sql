-- ============================================================================
-- Virpo Sales Call Intelligence Platform — Complete Supabase SQL Schema
-- Project Ref: dnqxuxuhfugowutamvlk
-- ============================================================================

-- 1. Grant Schema Permissions (fixes PostgREST "permission denied for schema public")
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 2. Executives Table
CREATE TABLE IF NOT EXISTS public.executives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id TEXT
);

-- 3. Calls Table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id UUID REFERENCES public.executives(id) ON DELETE SET NULL,
  lead_name TEXT,
  city TEXT,
  audio_url TEXT,
  duration INT,
  telephony_source TEXT DEFAULT 'manual_upload',
  language TEXT,
  processing_status TEXT DEFAULT 'completed',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transcripts Table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  segments JSONB,
  word_error_rate NUMERIC,
  stt_confidence NUMERIC
);

-- 5. Analyses Table
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  overall_score INT,
  sub_scores JSONB,
  penalties JSONB,
  total_deductions INT,
  confidence_level NUMERIC,
  summary_text TEXT,
  model_version TEXT,
  rubric_version TEXT
);

-- 6. Insights Table
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  text TEXT,
  quote TEXT,
  timestamp_ref TEXT
);

-- 7. Manager Overrides Table
CREATE TABLE IF NOT EXISTS public.manager_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  manager_id TEXT,
  original_score INT,
  corrected_score INT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Storage Bucket for Call Audio Recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage RLS Policies
DROP POLICY IF EXISTS "allow_anon_upload" ON storage.objects;
CREATE POLICY "allow_anon_upload" ON storage.objects
  FOR INSERT TO anon, authenticated, service_role
  WITH CHECK (bucket_id = 'call-recordings');

DROP POLICY IF EXISTS "allow_anon_select" ON storage.objects;
CREATE POLICY "allow_anon_select" ON storage.objects
  FOR SELECT TO anon, authenticated, service_role
  USING (bucket_id = 'call-recordings');

-- Grant all privileges on all newly created tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
