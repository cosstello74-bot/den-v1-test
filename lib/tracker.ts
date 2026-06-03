import type { TrackingEvent, TrackingEventType } from "@/types/product";

const STORAGE_KEY = "den_events";
const SESSION_KEY = "den_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function track(
  event: TrackingEventType,
  productId?: string,
  metadata: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  const entry: TrackingEvent = {
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    event,
    ...(productId ? { productId } : {}),
    metadata,
  };

  const existing = getEvents();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry]));
  } catch {
    // localStorage quota exceeded — silently skip
  }
}

export function getEvents(): TrackingEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackingEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
