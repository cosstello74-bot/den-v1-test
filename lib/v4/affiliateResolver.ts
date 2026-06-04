/**
 * V4 — Affiliate Resolver
 * Resolves Product → affiliate URL dynamically.
 * Pages must never store raw affiliate URLs — always call this resolver.
 */

import type { Product } from "@/types/product";

// ─── Network definitions ──────────────────────────────────────────────────────

export type AffiliateNetwork = "amazon" | "awin" | "cj" | "direct";

export type AffiliateEntry = {
  network:    AffiliateNetwork;
  rawUrl:     string;
  trackingId: string;
};

// ─── Network builder functions ────────────────────────────────────────────────

const TRACKING_IDS: Record<AffiliateNetwork, string> = {
  amazon: process.env.AMAZON_TRACKING_ID  ?? "den-21",
  awin:   process.env.AWIN_PUBLISHER_ID   ?? "0",
  cj:     process.env.CJ_PUBLISHER_ID     ?? "0",
  direct: "",
};

function buildAmazonUrl(rawUrl: string): string {
  const id  = TRACKING_IDS.amazon;
  const url = new URL(rawUrl);
  url.searchParams.set("tag", id);
  return url.toString();
}

function buildAwinUrl(rawUrl: string): string {
  const id = TRACKING_IDS.awin;
  return `https://www.awin1.com/cread.php?awinaffid=${id}&ued=${encodeURIComponent(rawUrl)}`;
}

function buildCjUrl(rawUrl: string): string {
  const id = TRACKING_IDS.cj;
  return `https://www.anrdoezrs.net/click-${id}-${encodeURIComponent(rawUrl)}`;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function detectNetwork(url: string): AffiliateNetwork {
  if (url.includes("amazon.co.uk") || url.includes("amazon.com")) return "amazon";
  if (url.includes("awin1.com"))                                    return "awin";
  if (url.includes("anrdoezrs.net") || url.includes("dpbolvw.net")) return "cj";
  return "direct";
}

export function resolveAffiliateUrl(product: Product): string {
  const raw     = product.affiliate_url;
  const network = detectNetwork(raw);

  switch (network) {
    case "amazon": return buildAmazonUrl(raw);
    case "awin":   return buildAwinUrl(raw);
    case "cj":     return buildCjUrl(raw);
    default:       return raw;
  }
}

export function resolveWithEntry(product: Product): AffiliateEntry {
  const network = detectNetwork(product.affiliate_url);
  return {
    network,
    rawUrl:     product.affiliate_url,
    trackingId: TRACKING_IDS[network],
  };
}
