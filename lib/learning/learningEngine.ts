/**
 * v2 Learning Engine — behavioural adjustment map.
 *
 * Computes per-product ranking biases from session-level signals:
 *   affiliate_clicked  → +20 bias (strongest positive signal)
 *   product_clicked    → +10 bias
 *   product_hover      → +2  bias (weak interest signal)
 *   viewed, not clicked → –3 bias (implicit rejection)
 *   repeated clicks    → +5 per additional (compounding interest)
 *
 * The bias is the 10% behaviour layer in:
 *   final_score = 0.55 basic + 0.35 revenue + 0.10 behaviour
 *
 * Returns: AdjustmentMap keyed by productId.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BehaviourAdjustment = {
  productId: string;
  bias:      number;    // –15 to +20 — added to composite score
  reason:    string;    // human-readable signal label
};

export type AdjustmentMap = Record<string, BehaviourAdjustment>;

type SignalEvent = {
  type:       string;
  productId?: string;
  timestamp:  number;
};

// ─── Signal weights ───────────────────────────────────────────────────────────

const SIGNAL = {
  AFFILIATE_CLICK:  20,
  PRODUCT_CLICK:    10,
  HOVER:             2,
  REPEAT_CLICK:      5,   // each additional click beyond the first
  VIEW_NO_CLICK:    -3,
};

// ─── Core engine ──────────────────────────────────────────────────────────────

/**
 * Derive an AdjustmentMap from a raw event array.
 * Accepts any array with { type, productId?, timestamp } shape.
 */
export function computeAdjustmentMap(events: SignalEvent[]): AdjustmentMap {
  const map: AdjustmentMap = {};

  // Tally per-product signal counts
  const counts = new Map<string, {
    affiliateClicks: number;
    clicks:          number;
    views:           number;
    hovers:          number;
  }>();

  for (const e of events) {
    if (!e.productId) continue;
    const c = counts.get(e.productId) ?? { affiliateClicks: 0, clicks: 0, views: 0, hovers: 0 };
    if      (e.type === "affiliate_clicked") c.affiliateClicks++;
    else if (e.type === "product_clicked")   c.clicks++;
    else if (e.type === "product_viewed")    c.views++;
    else if (e.type === "product_hover")     c.hovers++;
    counts.set(e.productId, c);
  }

  for (const [productId, c] of Array.from(counts.entries())) {
    let bias = 0;
    const reasons: string[] = [];

    if (c.affiliateClicks > 0) {
      bias += SIGNAL.AFFILIATE_CLICK + (c.affiliateClicks - 1) * SIGNAL.REPEAT_CLICK;
      reasons.push(
        c.affiliateClicks > 1
          ? `Affiliate clicked ×${c.affiliateClicks}`
          : "Affiliate clicked"
      );
    }

    if (c.clicks > 0 && c.affiliateClicks === 0) {
      bias += SIGNAL.PRODUCT_CLICK + (c.clicks - 1) * SIGNAL.REPEAT_CLICK;
      reasons.push(c.clicks > 1 ? `Product clicked ×${c.clicks}` : "Product clicked");
    }

    if (c.hovers > 0) {
      bias += SIGNAL.HOVER;
      reasons.push("Hover interest");
    }

    if (c.views > 0 && c.clicks === 0 && c.affiliateClicks === 0) {
      bias += SIGNAL.VIEW_NO_CLICK;
      reasons.push("Viewed, not clicked");
    }

    map[productId] = {
      productId,
      bias:   Math.max(-15, Math.min(20, Math.round(bias))),
      reason: reasons.join(" · ") || "No signal",
    };
  }

  return map;
}

/**
 * Apply an AdjustmentMap to a scored recommendation list.
 * Adds behaviour bias to each product's score and re-sorts.
 * Mutates rank numbers in-place.
 */
export function applyBehaviourAdjustment<
  T extends { product: { id: string }; score: number; rank: number }
>(
  recommendations: T[],
  adjustments:     AdjustmentMap
): T[] {
  const adjusted = recommendations.map((rec) => {
    const adj = adjustments[rec.product.id];
    return adj && adj.bias !== 0
      ? { ...rec, score: rec.score + adj.bias }
      : rec;
  });

  adjusted.sort((a, b) => b.score - a.score);
  adjusted.forEach((r, i) => { r.rank = i + 1; });

  return adjusted;
}

/**
 * Derive adjustment map directly from a BehaviorProfile.
 * Lighter version that doesn't require the full event array.
 */
export function adjustmentFromProfile(profile: {
  highAffiliateCtr: string[];
  lowPerformers:    string[];
  topProductId:     string | null;
}): AdjustmentMap {
  const map: AdjustmentMap = {};

  if (profile.topProductId) {
    map[profile.topProductId] = {
      productId: profile.topProductId,
      bias:      15,
      reason:    "Top affiliate performer this session",
    };
  }

  for (const pid of profile.highAffiliateCtr) {
    if (map[pid]) continue;
    map[pid] = { productId: pid, bias: 8, reason: "High affiliate CTR" };
  }

  for (const pid of profile.lowPerformers) {
    map[pid] = { productId: pid, bias: -5, reason: "Consistently ignored" };
  }

  return map;
}
