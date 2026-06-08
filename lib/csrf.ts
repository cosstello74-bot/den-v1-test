import { randomBytes, createHmac, timingSafeEqual } from "crypto";

function getCsrfSecret(): string {
  return process.env.ADMIN_PASSWORD ?? "den-csrf-dev-fallback";
}

/** Generates a signed CSRF token: `nonce.hmac` */
export function generateCsrfToken(): string {
  const nonce = randomBytes(16).toString("hex");
  const sig = createHmac("sha256", getCsrfSecret()).update(nonce).digest("hex");
  return `${nonce}.${sig}`;
}

/** Validates a CSRF token using timing-safe comparison */
export function validateCsrfToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const nonce = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getCsrfSecret()).update(nonce).digest("hex");
  try {
    return (
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    );
  } catch {
    return false;
  }
}
