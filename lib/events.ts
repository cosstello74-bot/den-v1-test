import { getEvents } from "./tracker";

const SYNC_INDEX_KEY = "den_events_sync_index";

export async function syncEvents(): Promise<{ ok: boolean; synced: number }> {
  if (typeof window === "undefined") return { ok: false, synced: 0 };

  const events = getEvents();
  if (events.length === 0) return { ok: true, synced: 0 };

  const lastIndex = parseInt(localStorage.getItem(SYNC_INDEX_KEY) ?? "0", 10);
  const pending = events.slice(lastIndex);
  if (pending.length === 0) return { ok: true, synced: 0 };

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: pending }),
    });

    if (res.ok) {
      localStorage.setItem(SYNC_INDEX_KEY, String(events.length));
      return { ok: true, synced: pending.length };
    }
    return { ok: false, synced: 0 };
  } catch {
    // Network unavailable — silently fail, events remain in queue
    return { ok: false, synced: 0 };
  }
}

export function getPendingSyncCount(): number {
  if (typeof window === "undefined") return 0;
  const events = getEvents();
  const lastIndex = parseInt(localStorage.getItem(SYNC_INDEX_KEY) ?? "0", 10);
  return Math.max(0, events.length - lastIndex);
}
