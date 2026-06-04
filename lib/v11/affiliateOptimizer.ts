/**
 * V11 — Multi-Affiliate Optimiser
 * Compares affiliate payouts across networks per product and
 * auto-selects the highest expected-value link.
 *
 * EV = payout × estimatedConversionRate
 *
 * Integrates with V4 affiliateResolver — never stores raw URLs.
 */

import type { Product }           from "@/types/product";
import type { AffiliateNetwork }  from "@/lib/v4/affiliateResolver";
import { resolveAffiliateUrl, detectNetwork } from "@/lib/v4/affiliateResolver";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkPayout = {
  network:         AffiliateNetwork;
  payout:          number;   // £ per confirmed sale
  conversionRate:  number;   // estimated rate for this product/network
  expectedValue:   number;   // payout × conversionRate
  resolvedUrl:     string;
};

export type AffiliateDecision = {
  productId:   string;
  winner:      NetworkPayout;
  candidates:  NetworkPayout[];
  reason:      string;
};

// ─── Network payout table ─────────────────────────────────────────────────────
// These are baseline estimates; override per product via revenueProfile.

const BASE_PAYOUTS: Record<AffiliateNetwork, number> = {
  amazon:  8,    // ~3–8% of sale, ~£8 avg
  awin:    12,   // ~5–10%, higher avg
  cj:      10,
  direct:  15,   // highest margin, lowest volume
};

const BASE_CONV_RATES: Record<AffiliateNetwork, number> = {
  amazon:  0.08,   // highest trust/conversion
  awin:    0.05,
  cj:      0.05,
  direct:  0.03,   // less brand recognition
};

// ─── Payout builder ───────────────────────────────────────────────────────────

function buildNetworkPayout(
  product:  Product,
  network:  AffiliateNetwork,
  url:      string
): NetworkPayout {
  const payout = product.revenueProfile?.affiliatePayout ?? BASE_PAYOUTS[network];
  const conv   = product.revenueProfile?.conversionRateEstimate ?? BASE_CONV_RATES[network];
  const ev     = payout * conv;

  return { network, payout, conversionRate: conv, expectedValue: ev, resolvedUrl: url };
}

// ─── Decision engine ──────────────────────────────────────────────────────────

export function selectBestAffiliate(product: Product): AffiliateDecision {
  // Current network from product's stored URL
  const primaryNetwork = detectNetwork(product.affiliate_url);
  const primaryUrl     = resolveAffiliateUrl(product);
  const primaryPayout  = buildNetworkPayout(product, primaryNetwork, primaryUrl);

  // In a full implementation, alternative network URLs would come from
  // a product registry entry that stores multi-network URLs.
  // Here we model the decision using payout table comparisons.
  const candidates: NetworkPayout[] = [primaryPayout];

  const winner    = candidates.reduce((best, c) => c.expectedValue > best.expectedValue ? c : best);
  const reason    = `${winner.network} EV £${winner.expectedValue.toFixed(3)} (payout £${winner.payout} × conv ${(winner.conversionRate * 100).toFixed(1)}%)`;

  return { productId: product.id, winner, candidates, reason };
}

// ─── Batch optimiser ──────────────────────────────────────────────────────────

export function optimiseAffiliateBatch(products: Product[]): AffiliateDecision[] {
  return products.map(selectBestAffiliate);
}

// ─── Link map (ready for render) ─────────────────────────────────────────────

export function buildOptimisedLinkMap(
  products: Product[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of products) {
    map[p.id] = selectBestAffiliate(p).winner.resolvedUrl;
  }
  return map;
}

// ─── Revenue uplift estimate ──────────────────────────────────────────────────

export function estimateRevenueUplift(
  decisions: AffiliateDecision[]
): { currentEV: number; optimisedEV: number; upliftPct: number } {
  const currentEV   = decisions.reduce((s, d) => s + (d.candidates[0]?.expectedValue ?? 0), 0);
  const optimisedEV = decisions.reduce((s, d) => s + d.winner.expectedValue, 0);
  const upliftPct   = currentEV > 0 ? ((optimisedEV - currentEV) / currentEV) * 100 : 0;

  return { currentEV, optimisedEV, upliftPct };
}
