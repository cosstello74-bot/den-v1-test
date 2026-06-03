const DECAY_CONSTANT = 0.15; // λ
const TRUTH_DECAY_CONSTANT = 0.075; // λ/2 — outcome signals decay 2× slower than interactions

// Raw decay weight for an event of given age
export function applyDecay(ageInDays: number): number {
  return Math.exp(-DECAY_CONSTANT * ageInDays);
}

// Decay weight for a specific timestamp
export function decayWeight(timestamp: number): number {
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return applyDecay(ageInDays);
}

// Time decay factor for scoring: maps [0, ∞) → [0.8, 1.0]
// Products with very recent engagement score 1.0; stale products score ~0.8
export function computeTimeDecayFactor(mostRecentTimestamp: number | null): number {
  if (mostRecentTimestamp === null) return 1.0;
  const ageInDays = (Date.now() - mostRecentTimestamp) / (1000 * 60 * 60 * 24);
  return 0.8 + 0.2 * Math.exp(-DECAY_CONSTANT * ageInDays);
}

// Truth decay — slower than interaction decay (λ=0.075)
export function applyTruthDecay(ageInDays: number): number {
  return Math.exp(-TRUTH_DECAY_CONSTANT * ageInDays);
}

export function truthDecayWeight(timestamp: number): number {
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return applyTruthDecay(ageInDays);
}
