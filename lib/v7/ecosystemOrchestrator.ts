/**
 * v7 Ecosystem Orchestrator.
 *
 * Manages the full registry of DEN nodes (virtual business instances).
 * Tracks per-node performance, compares efficiency, and decides which
 * nodes should be replicated, amplified, or deprioritised.
 *
 * localStorage key: den_v7_ecosystem
 * SSR-safe.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeStatus = "active" | "seeding" | "deprioritised" | "cloned";

export type DenNode = {
  nodeId:         string;       // unique stable id, e.g. "node_gaming_001"
  niche:          string;       // human label, e.g. "gaming laptops"
  domain:         string;       // simulated domain, e.g. "den-gaming-laptops.com"
  trafficShare:   number;       // 0–1 fraction of total simulated traffic
  revenueScore:   number;       // cumulative simulated revenue
  conversionRate: number;       // 0–1 latest observed conversion rate
  status:         NodeStatus;
  baseStrategy:   string;       // e.g. "revenue_optimised", "relevance_first"
  cloneOf:        string | null; // source node id if cloned
  generation:     number;       // 0 = seed, +1 per replication cycle
  createdAt:      number;       // timestamp ms
  lastUpdatedAt:  number;       // timestamp ms
};

export type EcosystemState = {
  nodes:          DenNode[];
  totalRevenue:   number;
  cycleCount:     number;
  lastCycleAt:    number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "den_v7_ecosystem";
const MAX_NODES   = 20;

/** Seed nodes — bootstrapped on first load. */
const SEED_NODES: Omit<DenNode, "createdAt" | "lastUpdatedAt">[] = [
  {
    nodeId: "node_gaming_001", niche: "gaming laptops",
    domain: "den-gaming-laptops.com", trafficShare: 0.30,
    revenueScore: 0, conversionRate: 0, status: "active",
    baseStrategy: "revenue_optimised", cloneOf: null, generation: 0,
  },
  {
    nodeId: "node_student_001", niche: "student laptops",
    domain: "den-student-laptops.com", trafficShare: 0.25,
    revenueScore: 0, conversionRate: 0, status: "active",
    baseStrategy: "relevance_first", cloneOf: null, generation: 0,
  },
  {
    nodeId: "node_work_001", niche: "work from home laptops",
    domain: "den-wfh-laptops.com", trafficShare: 0.20,
    revenueScore: 0, conversionRate: 0, status: "active",
    baseStrategy: "hybrid_balanced", cloneOf: null, generation: 0,
  },
  {
    nodeId: "node_coding_001", niche: "developer laptops",
    domain: "den-dev-laptops.com", trafficShare: 0.15,
    revenueScore: 0, conversionRate: 0, status: "seeding",
    baseStrategy: "engagement_weighted", cloneOf: null, generation: 0,
  },
  {
    nodeId: "node_budget_001", niche: "budget laptops",
    domain: "den-budget-laptops.com", trafficShare: 0.10,
    revenueScore: 0, conversionRate: 0, status: "seeding",
    baseStrategy: "revenue_optimised", cloneOf: null, generation: 0,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function defaultEcosystem(): EcosystemState {
  const now = Date.now();
  return {
    nodes:        SEED_NODES.map((n) => ({ ...n, createdAt: now, lastUpdatedAt: now })),
    totalRevenue: 0,
    cycleCount:   0,
    lastCycleAt:  0,
  };
}

export function loadEcosystem(): EcosystemState {
  if (typeof window === "undefined") return defaultEcosystem();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultEcosystem();
    const parsed = JSON.parse(raw) as EcosystemState;
    if (!parsed.nodes || parsed.nodes.length === 0) return defaultEcosystem();
    return parsed;
  } catch {
    return defaultEcosystem();
  }
}

export function saveEcosystem(state: EcosystemState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — silent fail
  }
}

export function clearEcosystem(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Node management ──────────────────────────────────────────────────────────

export function getActiveNodes(state: EcosystemState): DenNode[] {
  return state.nodes.filter((n) => n.status === "active" || n.status === "seeding");
}

export function getNodeById(state: EcosystemState, nodeId: string): DenNode | undefined {
  return state.nodes.find((n) => n.nodeId === nodeId);
}

export function updateNode(state: EcosystemState, nodeId: string, patch: Partial<DenNode>): EcosystemState {
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.nodeId === nodeId ? { ...n, ...patch, lastUpdatedAt: Date.now() } : n
    ),
  };
}

export function addNode(state: EcosystemState, node: DenNode): EcosystemState {
  if (state.nodes.length >= MAX_NODES) {
    // Replace lowest-revenue deprioritised node
    const idx = [...state.nodes]
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.status === "deprioritised")
      .sort((a, b) => a.n.revenueScore - b.n.revenueScore)[0]?.i;
    if (idx === undefined) return state; // no room
    const nodes = [...state.nodes];
    nodes[idx] = node;
    return { ...state, nodes };
  }
  return { ...state, nodes: [...state.nodes, node] };
}

// ─── Performance comparison ───────────────────────────────────────────────────

export type NodeRanking = DenNode & { rank: number; efficiencyScore: number };

/**
 * Rank nodes by efficiency score: conversionRate × revenueScore × trafficShare.
 * Active nodes always rank above seeding; deprioritised always last.
 */
export function rankNodes(nodes: DenNode[]): NodeRanking[] {
  const STATUS_WEIGHT: Record<NodeStatus, number> = {
    active: 1.0, seeding: 0.6, cloned: 0.8, deprioritised: 0.1,
  };

  const scored = nodes.map((n) => ({
    ...n,
    efficiencyScore:
      Math.round((n.conversionRate * Math.max(n.revenueScore, 0.001) * n.trafficShare * STATUS_WEIGHT[n.status]) * 10000) / 10000,
    rank: 0,
  }));

  scored.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  scored.forEach((n, i) => { n.rank = i + 1; });
  return scored;
}

/**
 * Determine the dominant niche (highest efficiency among active nodes).
 */
export function getDominantNiche(state: EcosystemState): string {
  const ranked = rankNodes(getActiveNodes(state));
  return ranked[0]?.niche ?? "unknown";
}

// ─── Cycle management ─────────────────────────────────────────────────────────

export function incrementCycle(state: EcosystemState): EcosystemState {
  return { ...state, cycleCount: state.cycleCount + 1, lastCycleAt: Date.now() };
}
