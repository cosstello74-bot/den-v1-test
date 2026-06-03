/**
 * v8 Conversion Physics Engine.
 *
 * Models conversion as a physical system with:
 *   - Attention as the input force
 *   - Intent strength as an amplifier
 *   - Friction as a resistive force (page load, complexity, distrust)
 *   - Trust score as a velocity multiplier
 *   - Saturation as a ceiling decay (diminishing returns at high volume)
 *
 * Core formula:
 *   base_conv    = attention × intent_strength × trust
 *   friction_adj = base_conv × (1 − friction²)
 *   saturated    = friction_adj × (1 − saturation_decay(friction_adj))
 *   final_conv   = clamp(saturated, 0, MAX_CONVERSION)
 *
 * All functions are pure — no I/O, no side effects.
 */

import type { EconomicAgent } from "../agents/economicAgent";
import { SV } from "../agents/economicAgent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversionInputs = {
  attention:      number;   // 0–1 from attention market
  intentStrength: number;   // 0–1 observed intent signal
  friction:       number;   // 0–1 page/UX friction (lower = better)
  trustScore:     number;   // 0–1
};

export type ConversionOutput = {
  agentId:          string;
  rawConversion:    number;   // before saturation
  finalConversion:  number;   // after saturation decay
  frictionPenalty:  number;   // percentage lost to friction
  saturationDecay:  number;   // percentage lost to saturation
  conversionForce:  number;   // attention × intent (the "input force")
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CONVERSION    = 0.25;   // 25% conversion ceiling — no system achieves 100%
const SATURATION_ONSET  = 0.10;   // saturation decay begins at 10% conversion
const SATURATION_K      = 8.0;    // logistic decay steepness

// ─── Physics functions ────────────────────────────────────────────────────────

/**
 * Friction resistive force.
 * friction² models squared resistance — small friction has small effect,
 * large friction has disproportionate impact.
 */
export function frictionForce(friction: number): number {
  return 1 - Math.min(0.99, friction * friction);
}

/**
 * Saturation decay function.
 * Returns a 0–1 decay multiplier that approaches 0 as conversion approaches ceiling.
 * Uses a logistic model: decay = 1 / (1 + e^(-k(c - onset)))
 */
export function saturationDecay(conversion: number): number {
  const logistic = 1 / (1 + Math.exp(-SATURATION_K * (conversion - SATURATION_ONSET)));
  return Math.round(logistic * 1000) / 1000;
}

/**
 * Trust velocity multiplier.
 * Low trust (<0.3) sharply reduces conversion; high trust (>0.7) provides bonus.
 */
export function trustMultiplier(trust: number): number {
  if (trust < 0.3) return 0.4 + trust * 0.6;   // steep penalty
  if (trust > 0.7) return 1.0 + (trust - 0.7) * 0.3;  // slight bonus
  return trust + 0.3;
}

/**
 * Compute full conversion physics for a single agent given inputs.
 */
export function computeConversion(agentId: string, inputs: ConversionInputs): ConversionOutput {
  const { attention, intentStrength, friction, trustScore } = inputs;

  // Step 1 — input force
  const conversionForce = attention * intentStrength;

  // Step 2 — trust adjustment
  const trustAdj = conversionForce * trustMultiplier(trustScore);

  // Step 3 — friction resistance
  const frictionMult  = frictionForce(friction);
  const frictionAdj   = trustAdj * frictionMult;
  const frictionPenalty = Math.round((1 - frictionMult) * 1000) / 1000;

  // Step 4 — saturation decay
  const decay         = saturationDecay(frictionAdj);
  const saturated     = frictionAdj * (1 - decay);
  const satDecayPct   = Math.round(decay * 1000) / 1000;

  const rawConversion   = Math.round(frictionAdj * 10000) / 10000;
  const finalConversion = Math.round(Math.min(MAX_CONVERSION, Math.max(0, saturated)) * 10000) / 10000;

  return {
    agentId,
    rawConversion,
    finalConversion,
    frictionPenalty,
    saturationDecay: satDecayPct,
    conversionForce: Math.round(conversionForce * 10000) / 10000,
  };
}

/**
 * Compute conversion for all agents in the economy.
 * Derives friction and trust from each agent's strategy vector.
 */
export function computeEconomyConversions(
  agents:        EconomicAgent[],
  intentSignals: Record<string, number>   // agentId → intent strength (0–1)
): ConversionOutput[] {
  return agents.map((agent) => {
    const trust     = agent.strategyVector[SV.TRUST]   ?? 0.5;
    const friction  = agent.strategyVector[SV.FRICTION] ?? 0.3;
    const intent    = intentSignals[agent.agentId] ?? 0.5;

    return computeConversion(agent.agentId, {
      attention:      agent.attentionShare,
      intentStrength: intent,
      friction,
      trustScore:     trust,
    });
  });
}

/**
 * Apply conversion outputs back to agents (update conversionEfficiency).
 */
export function applyConversions(
  agents:  EconomicAgent[],
  outputs: ConversionOutput[]
): EconomicAgent[] {
  const map = new Map(outputs.map((o) => [o.agentId, o.finalConversion]));
  return agents.map((a) => ({
    ...a,
    conversionEfficiency: map.get(a.agentId) ?? a.conversionEfficiency,
  }));
}
