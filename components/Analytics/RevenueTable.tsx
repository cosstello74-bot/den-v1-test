/**
 * Revenue table — server component.
 * Renders a sortable-by-score table of product revenue data.
 */

type ProductRevenueRow = {
  productId:    string;
  productName:  string;
  revenueScore: number;
  affiliateCtr: number;
  weightedCtr:  number;
  efficiency:   "high" | "medium" | "low";
  trend:        "rising" | "stable" | "declining";
};

type Props = {
  rows:   ProductRevenueRow[];
  title?: string;
};

const EFFICIENCY_STYLES: Record<string, string> = {
  high:   "text-violet-400 bg-violet-950/40 border-violet-900/30",
  medium: "text-gray-400 bg-gray-800/40 border-gray-700/30",
  low:    "text-gray-600 bg-gray-900/40 border-gray-800/20",
};

const TREND_STYLES: Record<string, { icon: string; class: string }> = {
  rising:   { icon: "↑", class: "text-emerald-400" },
  stable:   { icon: "→", class: "text-gray-500"    },
  declining:{ icon: "↓", class: "text-red-400"     },
};

export default function RevenueTable({ rows, title = "Product Revenue Performance" }: Props) {
  const sorted = [...rows].sort((a, b) => b.revenueScore - a.revenueScore);

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-gray-600 py-4">No revenue data yet.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right">Rev. Score</th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">Affiliate CTR</th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">Weighted CTR</th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider">Efficiency</th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider hidden sm:table-cell">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {sorted.map((row) => {
                const trend = TREND_STYLES[row.trend] ?? TREND_STYLES.stable;
                return (
                  <tr key={row.productId} className="hover:bg-gray-800/20">
                    <td className="px-4 py-3 font-medium text-gray-200">
                      <div>{row.productName}</div>
                      <div className="text-[10px] text-gray-600">{row.productId}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-indigo-400">
                      {row.revenueScore}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden sm:table-cell">
                      {row.affiliateCtr}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden sm:table-cell">
                      {row.weightedCtr}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${EFFICIENCY_STYLES[row.efficiency]}`}>
                        {row.efficiency}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold hidden sm:table-cell ${trend.class}`}>
                      {trend.icon}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
