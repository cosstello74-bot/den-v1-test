/**
 * Score bar for a single performance dimension.
 * Renders a labelled progress bar with colour-coded fill.
 */

type Props = {
  label:   string;
  score:   number;       // 0–100
  max?:    number;       // defaults to 100
  colour?: "indigo" | "emerald" | "amber" | "violet" | "rose";
  compact?: boolean;
};

const FILL_CLASSES: Record<NonNullable<Props["colour"]>, string> = {
  indigo:  "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  violet:  "bg-violet-500",
  rose:    "bg-rose-500",
};

function autoColour(score: number): NonNullable<Props["colour"]> {
  if (score >= 85) return "emerald";
  if (score >= 65) return "indigo";
  if (score >= 45) return "amber";
  return "rose";
}

export default function ProductScoreBar({
  label,
  score,
  max     = 100,
  colour,
  compact = false,
}: Props) {
  const pct        = Math.round((score / max) * 100);
  const fill       = FILL_CLASSES[colour ?? autoColour(score)];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-gray-400 w-7 text-right">{score}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-gray-300">{score}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
