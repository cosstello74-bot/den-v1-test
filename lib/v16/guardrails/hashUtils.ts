/**
 * V16 Guardrails — Hash utilities.
 *
 * Stable JSON hashing for determinism checks.
 * Sorts object keys before serialising so the hash is order-independent.
 */

/** Recursively sort object keys for stable serialisation. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Produce a stable string hash of any JSON-serialisable value.
 * Uses djb2 algorithm — fast, collision-resistant for guardrail purposes.
 */
export function stableHash(value: unknown): string {
  const json   = JSON.stringify(sortKeys(value));
  let   hash   = 5381;

  for (let i = 0; i < json.length; i++) {
    // djb2: hash = ((hash << 5) + hash) ^ charCode
    hash = ((hash << 5) + hash) ^ json.charCodeAt(i);
    hash |= 0; // coerce to 32-bit integer
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Hash an array of product IDs — used to fingerprint a rank order. */
export function hashRankOrder(productIds: string[]): string {
  return stableHash(productIds);
}

/** Hash a params object — used to fingerprint a scoring input. */
export function hashInputParams(
  category: string,
  params:   Record<string, string>,
): string {
  return stableHash({ category, params });
}
