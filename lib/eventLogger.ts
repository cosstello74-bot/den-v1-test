import type { Event, EventType } from "@/types/event";
import { detectSegment } from "./segment";

const STORAGE_KEY = "den_v31_events";
const SYNC_KEY    = "den_v31_sync_index";
const SESSION_KEY = "den_v31_session_id";

// ─── Session ──────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Storage helpers ──────────────────────────────────────────────────────

export function getStoredEvents(): Event[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Event[]) : [];
  } catch {
    return [];
  }
}

export function clearStoredEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SYNC_KEY);
}

// ─── Core logger ─────────────────────────────────────────────────────────

export function logEvent(
  type: EventType,
  category: string,
  options: {
    productId?: string;
    purpose?: string;
    budget?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  if (typeof window === "undefined") return;

  const segment = detectSegment(options.purpose);

  const event: Event = {
    id: generateId(),
    timestamp: Date.now(),
    sessionId: getSessionId(),
    type,
    category,
    ...(options.productId ? { productId: options.productId } : {}),
    metadata: {
      ...(options.purpose ? { purpose: options.purpose } : {}),
      ...(options.budget  ? { budget: options.budget }   : {}),
      segment,
      ...options.metadata,
    },
  };

  const existing = getStoredEvents();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, event]));
  } catch {
    // quota exceeded — silently skip
  }

  // Debounced batch sync
  scheduleBatchSync();
}

// ─── Debounced batch sync ─────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleBatchSync(): void {
  if (typeof window === "undefined") return;
  if (syncTimer) return;
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushPendingEvents();
  }, 2000);
}

export async function flushPendingEvents(): Promise<{ synced: number }> {
  if (typeof window === "undefined") return { synced: 0 };

  const events = getStoredEvents();
  if (events.length === 0) return { synced: 0 };

  const lastIndex = parseInt(localStorage.getItem(SYNC_KEY) ?? "0", 10);
  const pending = events.slice(lastIndex);
  if (pending.length === 0) return { synced: 0 };

  try {
    const res = await fetch("/api/events/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: pending }),
    });

    if (res.ok) {
      localStorage.setItem(SYNC_KEY, String(events.length));
      return { synced: pending.length };
    }
  } catch {
    // Network unavailable — events remain queued
  }
  return { synced: 0 };
}
