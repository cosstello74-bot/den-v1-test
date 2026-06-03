// SERVER-SIDE ONLY — do not import from client components.
// Reads the append-only events.json on disk.

import type { Event, EventType } from "@/types/event";

const EVENTS_PATH = () => {
  // Dynamic import path to avoid bundler issues
  const path = require("path") as typeof import("path");
  return path.join(process.cwd(), "data", "events.json");
};

export function readAllEvents(): Event[] {
  try {
    const fs = require("fs") as typeof import("fs");
    const raw = fs.readFileSync(EVENTS_PATH(), "utf8");
    return JSON.parse(raw) as Event[];
  } catch {
    return [];
  }
}

export function appendEvents(newEvents: Event[]): void {
  const existing = readAllEvents();
  // Dedup by event id to maintain idempotency
  const existingIds = new Set(existing.map((e) => e.id));
  const fresh = newEvents.filter((e) => !existingIds.has(e.id));
  if (fresh.length === 0) return;
  try {
    const fs = require("fs") as typeof import("fs");
    fs.writeFileSync(EVENTS_PATH(), JSON.stringify([...existing, ...fresh], null, 2));
  } catch {
    // Read-only filesystem (e.g. Vercel) — in-memory model remains valid
  }
}

export type FilterOptions = {
  category?: string;
  productId?: string;
  sessionId?: string;
  type?: EventType;
  since?: number; // Unix ms
};

export function queryEvents(filters: FilterOptions = {}): Event[] {
  let events = readAllEvents();
  if (filters.category)  events = events.filter((e) => e.category === filters.category);
  if (filters.productId) events = events.filter((e) => e.productId === filters.productId);
  if (filters.sessionId) events = events.filter((e) => e.sessionId === filters.sessionId);
  if (filters.type)      events = events.filter((e) => e.type === filters.type);
  if (filters.since)     events = events.filter((e) => e.timestamp >= filters.since!);
  return events;
}
