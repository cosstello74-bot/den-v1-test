import type { TrackingEvent } from "@/types/product";

export type ProductFeedback = {
  impressions: number;
  clicks: number;
  ctr: number;
};

export type FeedbackMap = Record<string, ProductFeedback>;

export function getProductFeedback(events: TrackingEvent[]): FeedbackMap {
  const feedback: FeedbackMap = {};

  for (const event of events) {
    const productId = event.productId;
    if (!productId) continue;

    if (!feedback[productId]) {
      feedback[productId] = { impressions: 0, clicks: 0, ctr: 0 };
    }

    if (event.event === "product_viewed") {
      feedback[productId].impressions += 1;
    }
    if (event.event === "affiliate_clicked") {
      feedback[productId].clicks += 1;
    }
  }

  // Compute CTR for each product
  for (const id of Object.keys(feedback)) {
    const f = feedback[id];
    f.ctr = f.impressions > 0 ? (f.clicks / f.impressions) * 100 : 0;
  }

  return feedback;
}
