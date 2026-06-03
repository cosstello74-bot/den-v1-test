/**
 * Funnel chart — server component.
 * Renders the conversion funnel as horizontal bars.
 * Each stage shows count and drop-off rate vs previous stage.
 */

import type { FunnelMetrics } from "@/lib/learning/eventAggregator";

type FunnelStage = {
  label:     string;
  count:     number;
  rate:      number | null; // % of previous stage, null for first
  colour:    string;
};

type Props = {
  funnel: FunnelMetrics;
  title?: string;
};

function buildStages(f: FunnelMetrics): FunnelStage[] {
  return [
    { label: "Page Views",        count: f.pageViews,       rate: null,             colour: "bg-indigo-600" },
    { label: "Quiz Started",      count: f.quizStarts,      rate: f.quizStartRate,   colour: "bg-indigo-500" },
    { label: "Quiz Completed",    count: f.quizCompletes,   rate: f.quizCompleteRate, colour: "bg-violet-500" },
    { label: "Results Viewed",    count: f.resultsViews,    rate: f.resultsViewRate,  colour: "bg-violet-400" },
    { label: "Products Viewed",   count: f.productViews,    rate: null,              colour: "bg-amber-500"  },
    { label: "Affiliate Clicks",  count: f.affiliateClicks, rate: f.clickThroughRate, colour: "bg-emerald-500" },
  ];
}

export default function FunnelChart({ funnel, title = "Conversion Funnel" }: Props) {
  const stages   = buildStages(funnel);
  const maxCount = stages[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      )}
      <div className="space-y-2">
        {stages.map((stage) => {
          const pct = maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0;
          return (
            <div key={stage.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{stage.label}</span>
                <div className="flex items-center gap-3 text-right">
                  {stage.rate !== null && (
                    <span className="text-gray-600 tabular-nums">
                      {stage.rate}% of prev
                    </span>
                  )}
                  <span className="text-gray-300 font-semibold tabular-nums w-8">
                    {stage.count}
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.colour}`}
                  style={{ width: pct > 0 ? `${pct}%` : "2px", minWidth: stage.count > 0 ? "4px" : "0" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {maxCount === 0 && (
        <p className="text-xs text-gray-600 pt-2">No funnel data yet — awaiting first sessions.</p>
      )}
    </div>
  );
}
