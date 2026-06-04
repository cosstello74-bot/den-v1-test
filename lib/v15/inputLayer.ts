/**
 * V15 — Input Layer
 *
 * Pure passthrough. Accepts raw URL params and returns them as a plain
 * dictionary. NO schema enforcement. NO category defaults. NO field
 * dropping. All downstream interpretation is the scoring layer's
 * responsibility.
 *
 * Rule: this module must never import from category, scoring, or product
 * modules. If it does, the layer boundary has been violated.
 */

/**
 * Collect all URL search params into a plain Record.
 * Every key the quiz wrote is preserved, including category-specific ones
 * (os_preference, refresh_priority, form_factor, stylus_needed, etc.)
 * that a laptop-biased schema would silently discard.
 */
export function collectParams(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
