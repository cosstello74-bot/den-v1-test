// Confidence tiers based on interaction count — how much to trust the signal
export function getConfidenceWeight(count: number): number {
  if (count >= 50) return 1.0;
  if (count >= 10) return 0.8;
  return 0.5;
}

// Raw confidence score [0, 1] — continuous ramp for display purposes
export function getConfidenceScore(count: number): number {
  return Math.min(count / 50, 1.0);
}
