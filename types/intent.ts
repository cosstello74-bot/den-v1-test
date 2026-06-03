/**
 * Intent types — SEO intent mapping and AEL page generation contracts.
 */

import type { CategoryKey } from "@/types/product";

// ─── SEO intent ───────────────────────────────────────────────────────────────

/** A single intent → page mapping entry. */
export interface IntentPageEntry {
  slug:          string;
  category:      CategoryKey;
  title:         string;
  h1:            string;
  description:   string;
  keywords:      string[];
  canonical:     string;
  intentKeyword: string;
}

/** Result of matching a user profile to an intent page. */
export interface IntentMatchResult {
  page:       IntentPageEntry;
  confidence: number;   // 0–1
}

// ─── AEL intent ───────────────────────────────────────────────────────────────

/** An AEL-discovered intent not yet served by a page. */
export interface DiscoveredIntent {
  id:            string;
  keyword:       string;
  category:      CategoryKey;
  estimatedVolume: number;
  conversionPotential: number;
  priority:      number;   // 0–100
  status:        "pending" | "generating" | "live" | "suppressed";
  discoveredAt:  string;   // ISO
}

/** Persistent store for discovered intents (data/intents.json). */
export interface IntentsFile {
  updatedAt: string;
  intents:   DiscoveredIntent[];
}
