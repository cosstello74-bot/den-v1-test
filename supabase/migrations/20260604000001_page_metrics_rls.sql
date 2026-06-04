-- Migration: RLS for page_metrics + guardrail_violations table
-- Run via: supabase db push  OR  copy into the Supabase SQL editor

-- ─── page_metrics ────────────────────────────────────────────────────────────

-- Enable row-level security
ALTER TABLE page_metrics ENABLE ROW LEVEL SECURITY;

-- Server-side writes only (service role key, used in API routes).
-- No public reads or writes.
CREATE POLICY "service_role_insert" ON page_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select" ON page_metrics
  FOR SELECT
  TO service_role
  USING (true);

-- Deny everything to anon / authenticated roles
-- (no explicit policy = deny by default when RLS is enabled)

-- ─── guardrail_violations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guardrail_violations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  rule         text        NOT NULL,
  message      text        NOT NULL,
  category     text,
  data         jsonb
);

ALTER TABLE guardrail_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_insert" ON guardrail_violations
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select" ON guardrail_violations
  FOR SELECT
  TO service_role
  USING (true);
