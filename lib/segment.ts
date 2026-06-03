import type { SegmentType } from "@/types/event";

export { type SegmentType };

export const SEGMENTS: SegmentType[] = [
  "student",
  "gamer",
  "professional",
  "creator",
  "general",
];

// Detect segment from quiz purpose answer
export function detectSegment(purpose: string | undefined): SegmentType {
  switch (purpose) {
    case "university": return "student";
    case "gaming":     return "gamer";
    case "work":       return "professional";
    case "creative":   return "creator";
    default:           return "general";
  }
}
