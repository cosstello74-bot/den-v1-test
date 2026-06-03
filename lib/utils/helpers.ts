/**
 * General utility helpers used across the DEN system.
 * Pure functions — no imports from other lib modules.
 */

// ─── Number ───────────────────────────────────────────────────────────────────

/** Clamp a number between min and max inclusive. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimal places. */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Format a score (0–100) with a fixed number of decimal places. */
export function formatScore(score: number, decimals = 0): string {
  return score.toFixed(decimals);
}

/** Format a decimal as a percentage string, e.g. 0.352 → "35.2%" */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format a £ monetary value, e.g. 14.5 → "£14.50" */
export function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

/** Normalise a raw value to 0–100 given a known max. */
export function normalise(value: number, max: number): number {
  if (max === 0) return 0;
  return clamp(Math.round((value / max) * 100), 0, 100);
}

// ─── String ───────────────────────────────────────────────────────────────────

/** Convert a string to a URL-safe slug. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Truncate a string to maxLength, appending "…" if truncated. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/** Capitalise the first letter of a string. */
export function capitalise(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert a snake_case or kebab-case string to Title Case. */
export function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .split(" ")
    .map(capitalise)
    .join(" ");
}

// ─── Array ────────────────────────────────────────────────────────────────────

/** Deduplicate an array, preserving order. */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** Return the top N items from an array sorted by a numeric key. */
export function topN<T>(arr: T[], key: (item: T) => number, n: number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a)).slice(0, n);
}

/** Group an array of objects by a string key. */
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    acc[k] = acc[k] ?? [];
    acc[k].push(item);
    return acc;
  }, {});
}

// ─── Date ─────────────────────────────────────────────────────────────────────

/** Format a Unix ms timestamp as a short date string, e.g. "3 Jun 2026". */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

/** Return human-readable time-ago string, e.g. "2 hours ago". */
export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (days > 0)    return `${days}d ago`;
  if (hours > 0)   return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
