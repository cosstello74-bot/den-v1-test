/**
 * Reusable product card component.
 *
 * Used in the results page and landing pages.
 * Accepts a Product and optional display options.
 */

import type { Product } from "@/types/product";
import ProductScoreBar from "./ProductScoreBar";
import RevenueBadge   from "./RevenueBadge";

type Props = {
  product:          Product;
  rank:             number;
  score:            number;
  strengths?:       string[];
  revenueScore?:    number;
  revenueEfficiency?: "high" | "medium" | "low";
  compact?:         boolean;
};

const PRICE_BAND_LABEL: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

export default function ProductCard({
  product,
  rank,
  score,
  strengths       = [],
  revenueScore,
  revenueEfficiency,
  compact         = false,
}: Props) {
  const isTop = rank === 1;

  if (compact) {
    return (
      <div className={`flex items-center gap-4 bg-gray-900 border rounded-xl p-4 ${isTop ? "border-indigo-800/50" : "border-gray-800"}`}>
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isTop ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-100 truncate">{product.name}</div>
          <div className="text-[11px] text-gray-500">{product.brand} · {PRICE_BAND_LABEL[product.price_band]}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-400 tabular-nums">{score}</div>
        </div>
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="shrink-0 text-xs font-semibold text-indigo-400 border border-indigo-800/60 bg-indigo-950/30 hover:bg-indigo-900/40 px-3 py-2 rounded-lg transition-colors"
        >
          View →
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border rounded-2xl overflow-hidden ${isTop ? "border-indigo-800/50 shadow-sm shadow-indigo-900/20" : "border-gray-800"}`}>
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Rank */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
          rank === 1 ? "bg-indigo-600 text-white" :
          rank === 2 ? "bg-gray-700 text-gray-200" :
                       "bg-gray-800/60 text-gray-500"
        }`}>
          {rank}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-100">{product.name}</span>
              {isTop && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                  Top Pick
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">{product.brand}</span>
              <span className="text-[11px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                {PRICE_BAND_LABEL[product.price_band] ?? product.price_band}
              </span>
              {revenueEfficiency && (
                <RevenueBadge efficiency={revenueEfficiency} revenueScore={revenueScore} />
              )}
            </div>
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {strengths.slice(0, 3).map((s) => (
                <span key={s} className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score + CTA */}
        <div className="shrink-0 flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-600 uppercase tracking-wide">Score</div>
            <div className="text-2xl font-bold tabular-nums text-indigo-400">{score}</div>
          </div>
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors"
          >
            View deal
          </a>
        </div>
      </div>

      {/* Score bars */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-800/60 pt-4">
        <ProductScoreBar label="Productivity" score={product.productivity_score} compact />
        <ProductScoreBar label="Battery"      score={product.battery_score}      compact colour="emerald" />
        <ProductScoreBar label="Value"        score={product.value_score}         compact colour="amber"  />
        <ProductScoreBar label="Gaming"       score={product.gaming_score}        compact colour="violet" />
      </div>
    </div>
  );
}
