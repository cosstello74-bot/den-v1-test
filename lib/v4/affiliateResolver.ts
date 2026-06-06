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

/** Returns the first active (non-PENDING) URL from affiliate_urls, or falls back to affiliate_url. */
function pickBestRaw(product: Product): { url: string; network: AffiliateNetwork } {
  if (product.affiliate_urls?.length) {
    const active = product.affiliate_urls.find(
      (l) => l.url && l.url !== "PENDING"
    );
    if (active) return { url: active.url, network: active.network as AffiliateNetwork };
  }
  const url = product.affiliate_url;
  return { url, network: detectNetwork(url) };
}

export function resolveAffiliateUrl(product: Product): string {
  const { url, network } = pickBestRaw(product);

  switch (network) {
    case "amazon": return buildAmazonUrl(url);
    case "awin":   return buildAwinUrl(url);
    case "cj":     return buildCjUrl(url);
    default:       return url;
  }
}

export function resolveWithEntry(product: Product): AffiliateEntry {
  const { url, network } = pickBestRaw(product);
  return {
    network,
    rawUrl:     url,
    trackingId: TRACKING_IDS[network],
  };

}

/** Returns all active affiliate links for a product, with tracking applied. */
export function resolveAllAffiliateUrls(
  product: Product
): Array<{ retailer: string; url: string; commission_pct: number }> {
  if (!product.affiliate_urls?.length) {
    return [{ retailer: "amazon", url: resolveAffiliateUrl(product), commission_pct: 1.5 }];
  }
  return product.affiliate_urls
    .filter((l) => l.url && l.url !== "PENDING")
    .map((l) => {
      const network = l.network as AffiliateNetwork;
      let tracked = l.url;
      if (network === "amazon") tracked = buildAmazonUrl(l.url);
      if (network === "awin")   tracked = buildAwinUrl(l.url);
      if (network === "cj")     tracked = buildCjUrl(l.url);
      return { retailer: l.retailer, url: tracked, commission_pct: l.commission_pct };
    });
}
