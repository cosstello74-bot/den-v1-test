/**
 * Supabase client — server-side only.
 * Uses SUPABASE_SERVICE_ROLE_KEY when available (bypasses RLS, safe for server routes).
 * Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY with RLS enforced.
 * Returns null when neither env var is set — callers fall back to in-memory behaviour.
 *
 * Required Supabase table — run once in the Supabase SQL editor:
 *
 *   create table if not exists den_events (
 *     id          text primary key,
 *     timestamp   bigint not null,
 *     session_id  text not null,
 *     type        text not null,
 *     category    text not null,
 *     product_id  text,
 *     metadata    jsonb,
 *     created_at  timestamptz default now()
 *   );
 *   alter table den_events enable row level security;
 *   create index if not exists idx_den_events_ts  on den_events(timestamp desc);
 *   create index if not exists idx_den_events_cat on den_events(category);
 *   create index if not exists idx_den_events_pid on den_events(product_id);
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key);
  return _client;
}
