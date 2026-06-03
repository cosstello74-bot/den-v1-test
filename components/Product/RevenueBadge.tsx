/**
 * Revenue efficiency badge — shown on product cards.
 * Indicates high / medium / low affiliate revenue potential.
 * Visible only when NEXT_PUBLIC_AFFILIATE_MODE=true.
 */

type Efficiency = "high" | "medium" | "low";

type Props = {
  efficiency: Efficiency;
  revenueScore?: number;
  showScore?: boolean;
};

const BADGE_STYLES: Record<Efficiency, string> = {
  high:   "bg-violet-950/50 border-violet-800/40 text-violet-400",
  medium: "bg-gray-900/60 border-gray-700/40 text-gray-400",
  low:    "bg-gray-900/40 border-gray-800/30 text-gray-600",
};

const BADGE_LABELS: Record<Efficiency, string> = {
  high:   "High revenue efficiency",
  medium: "Medium revenue",
  low:    "Low revenue",
};

export default function RevenueBadge({ efficiency, revenueScore, showScore = false }: Props) {
  if (process.env.NEXT_PUBLIC_AFFILIATE_MODE !== "true") return null;
  if (efficiency === "low") return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 rounded-full ${BADGE_STYLES[efficiency]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {BADGE_LABELS[efficiency]}
      {showScore && revenueScore !== undefined && (
        <span className="opacity-60 ml-0.5">· {revenueScore}</span>
      )}
    </span>
  );
}
