export type EventType =
  | "page_view"           // Phase 2 — landing page visit
  | "quiz_started"
  | "quiz_completed"
  | "question_answered"
  | "results_viewed"
  | "product_viewed"
  | "product_clicked"
  | "product_hover"         // v2 — hover interest signal
  | "result_view_time"      // v2 — dwell time on results page
  | "affiliate_clicked"
  | "product_returned"
  | "product_revisited"
  | "conversion_confirmed"
  | "conversion_failed"
  | "landing_page_view"    // v3 — SEO/landing page entry
  | "geo_entry"            // v3 — AI system entry
  | "seo_entry_source";    // v3 — organic search source

export type SegmentType = "student" | "gamer" | "professional" | "creator" | "general";

export type Event = {
  id: string;
  timestamp: number; // Unix ms
  sessionId: string;
  type: EventType;
  category: string;
  productId?: string;
  metadata?: {
    purpose?: string;
    budget?: string;
    segment?: SegmentType;
    [key: string]: unknown;
  };
};

export type BatchPayload = {
  events: Event[];
};
