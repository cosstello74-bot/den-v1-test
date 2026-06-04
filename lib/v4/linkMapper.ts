/**
 * V4 — Link Mapper
 * Maps product IDs to resolved affiliate URLs.
 * Build once per render cycle; never cache raw URLs in page state.
 */

import type { Product } from "@/types/product";
import { resolveAffiliateUrl, resolveWithEntry } from "./affiliateResolver";
import type { AffiliateEntry } from "./affiliateResolver";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LinkMap    = Record<string, string>;
export type EntryMap   = Record<string, AffiliateEntry>;

// ─── Map builders ─────────────────────────────────────────────────────────────

export function buildLinkMap(products: Product[]): LinkMap {
  const map: LinkMap = {};
  for (const p of products) {
    map[p.id] = resolveAffiliateUrl(p);
  }
  return map;
}

export function buildEntryMap(products: Product[]): EntryMap {
  const map: EntryMap = {};
  for (const p of products) {
    map[p.id] = resolveWithEntry(p);
  }
  return map;
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getLink(map: LinkMap, productId: string): string | undefined {
  return map[productId];
}

export function getNetworkSplit(map: EntryMap): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of Object.values(map)) {
    counts[entry.network] = (counts[entry.network] ?? 0) + 1;
  }
  return counts;
}
