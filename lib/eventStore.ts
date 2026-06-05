// SERVER-SIDE ONLY — do not import from client components.
//
// Persistent event store backed by Supabase when configured.
// Falls back to a process-level in-memory array in dev or when
// NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.

import type { Event, EventType } from "@/types/event";
import { getSupabaseClient } from "@/lib/db/supabaseClient";

// In-memory fallback — persists within a single serverless instance lifetime
const memoryStore: Event[] = [];

// ── Row mapping ────────────────────────────────────────────────────────────────

function rowToEvent(row: Record<string, unknown>): Event {
  return {
    id:        row.id        as string,
    timestamp: row.timestamp as number,
    sessionId: row.session_id as string,
    type:      row.type      as EventType,
    category:  row.category  as string,
    productId: row.product_id as string | undefined,
    metadata:  (row.metadata ?? {}) as Event["metadata"],
  };
}

function eventToRow(e: Event): Record<string, unknown> {
  return {
    id:         e.id,
    timestamp:  e.timestamp,
    session_id: e.sessionId,
    type:       e.type,
    category:   e.category,
    product_id: e.productId ?? null,
    metadata:   e.metadata ?? null,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function readAllEvents(): Promise<Event[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb
      .from("den_events")
      .select("*")
      .order("timestamp", { ascending: true });
    if (!error && data) return data.map(rowToEvent);
  }
  return [...memoryStore];
}

export async function appendEvents(newEvents: Event[]): Promise<void> {
  if (newEvents.length === 0) return;

  const sb = getSupabaseClient();
  if (sb) {
    const rows = newEvents.map(eventToRow);
    await sb.from("den_events").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    return;
  }

  // In-memory fallback
  const existingIds = new Set(memoryStore.map((e) => e.id));
  for (const e of newEvents) {
    if (!existingIds.has(e.id)) memoryStore.push(e);
  }
}

export type FilterOptions = {
  category?: string;
  productId?: string;
  sessionId?: string;
  type?: EventType;
  since?: number; // Unix ms
};

export async function queryEvents(filters: FilterOptions = {}): Promise<Event[]> {
  let events = await readAllEvents();
  if (filters.category)  events = events.filter((e) => e.category  === filters.category);
  if (filters.productId) events = events.filter((e) => e.productId === filters.productId);
  if (filters.sessionId) events = events.filter((e) => e.sessionId === filters.sessionId);
  if (filters.type)      events = events.filter((e) => e.type      === filters.type);
  if (filters.since)     events = events.filter((e) => e.timestamp >= filters.since!);
  return events;
}
