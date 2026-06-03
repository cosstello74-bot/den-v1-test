/**
 * Traffic source detection.
 *
 * Parses `document.referrer` (or any referrer string) into a structured
 * source label. Used by the revenue engine and event logger to weight
 * affiliate conversion probability by acquisition channel.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrafficSourceLabel =
  | "google"
  | "bing"
  | "reddit"
  | "quora"
  | "tiktok"
  | "twitter"
  | "youtube"
  | "facebook"
  | "direct"
  | "email"
  | "referral"
  | "unknown";

export interface TrafficSourceInfo {
  source:   TrafficSourceLabel;
  channel:  "organic_search" | "social" | "direct" | "referral" | "unknown";
  label:    string;
}

// ─── Detection rules ──────────────────────────────────────────────────────────

type DetectionRule = {
  match:   string | RegExp;
  source:  TrafficSourceLabel;
  channel: TrafficSourceInfo["channel"];
  label:   string;
};

const RULES: DetectionRule[] = [
  { match: "google.",     source: "google",   channel: "organic_search", label: "Google Search" },
  { match: "bing.com",    source: "bing",     channel: "organic_search", label: "Bing Search"   },
  { match: "reddit.com",  source: "reddit",   channel: "social",         label: "Reddit"        },
  { match: "quora.com",   source: "quora",    channel: "referral",       label: "Quora"         },
  { match: "tiktok.com",  source: "tiktok",   channel: "social",         label: "TikTok"        },
  { match: "twitter.com", source: "twitter",  channel: "social",         label: "Twitter / X"   },
  { match: "t.co",        source: "twitter",  channel: "social",         label: "Twitter / X"   },
  { match: "youtube.com", source: "youtube",  channel: "social",         label: "YouTube"       },
  { match: "facebook.com",source: "facebook", channel: "social",         label: "Facebook"      },
  { match: "fb.me",       source: "facebook", channel: "social",         label: "Facebook"      },
  { match: /mailto:/,     source: "email",    channel: "direct",         label: "Email"         },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a referrer string into structured TrafficSourceInfo.
 * Pass `document.referrer` in client-side code, or the Referer header server-side.
 */
export function detectTrafficSource(referrer?: string | null): TrafficSourceInfo {
  if (!referrer || referrer === "") {
    return { source: "direct", channel: "direct", label: "Direct" };
  }

  const lower = referrer.toLowerCase();

  for (const rule of RULES) {
    const matched =
      typeof rule.match === "string"
        ? lower.includes(rule.match)
        : rule.match.test(lower);

    if (matched) {
      return { source: rule.source, channel: rule.channel, label: rule.label };
    }
  }

  // Has a referrer but no rule matched → external referral
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return { source: "referral", channel: "referral", label: `Referral (${host})` };
  } catch {
    return { source: "unknown", channel: "unknown", label: "Unknown" };
  }
}

/**
 * Map a TrafficSourceLabel to the legacy TrafficSource enum used by trafficWeights.ts.
 * Bridges the two source detection systems.
 */
export function toLegacySource(
  source: TrafficSourceLabel
): "organic_search" | "direct" | "social" | "referral" | "unknown" {
  const map: Record<TrafficSourceLabel, "organic_search" | "direct" | "social" | "referral" | "unknown"> = {
    google:   "organic_search",
    bing:     "organic_search",
    reddit:   "social",
    quora:    "referral",
    tiktok:   "social",
    twitter:  "social",
    youtube:  "social",
    facebook: "social",
    direct:   "direct",
    email:    "direct",
    referral: "referral",
    unknown:  "unknown",
  };
  return map[source] ?? "unknown";
}
