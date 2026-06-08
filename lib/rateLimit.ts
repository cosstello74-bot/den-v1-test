import { NextRequest } from "next/server";

// In-memory sliding window rate limiter.
// Per-serverless-instance — sufficient to block brute-force on a single session.
// For cross-instance distributed limiting, replace with Upstash Redis.
const attempts = new Map<string, number[]>();

export function checkRateLimit(
  ip: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (attempts.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxAttempts) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  attempts.set(ip, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
