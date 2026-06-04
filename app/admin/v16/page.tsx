/**
 * /admin/v16 — V16/V17 Operations Dashboard
 *
 * Server component: reads snapshot at request time.
 * No auth — protect via Vercel password protection or middleware.
 */

import { getDashboardSnapshot } from "@/lib/v17/dashboard/dashboardAggregator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "healthy" | "degraded" | "critical" }) {
  const cls =
    status === "healthy"  ? "bg-emerald-500" :
    status === "degraded" ? "bg-amber-500"   : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-2`} />;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function delta(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(2)}%`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminV16Page() {
  const snap = getDashboardSnapshot();
  const ts   = new Date(snap.timestamp).toUTCString();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-mono text-sm">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">V16 / V17 Dashboard</h1>
            <p className="text-gray-600 text-xs mt-1">{ts}</p>
          </div>
          <div className="flex items-center gap-2 text-xs border border-gray-800 rounded-lg px-3 py-2">
            <StatusDot status={snap.overall.status} />
            <span className="text-gray-300 capitalize">{snap.overall.status}</span>
          </div>
        </div>

        {/* Overall flags */}
        {snap.overall.flags.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Active Flags</h2>
            <ul className="space-y-1">
              {snap.overall.flags.map((f) => (
                <li key={f} className="text-amber-300 bg-amber-950/30 border border-amber-900/40 rounded px-3 py-1.5">
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Rollout state */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Rollout</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Stage",       value: snap.rollout.stage },
              { label: "Percent",     value: `${snap.rollout.rolloutPercent}%` },
              { label: "Shadow Days", value: snap.rollout.shadowDays.toString() },
              { label: "Violations",  value: snap.guardrails.violationsTotal.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-600">{label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue audit */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Revenue Influence</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className={
                snap.revenueAudit.status === "clean"    ? "text-emerald-400" :
                snap.revenueAudit.status === "warning"  ? "text-amber-400"   : "text-red-400"
              }>
                {snap.revenueAudit.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
              <span className="text-gray-400">Tiebreak count</span>
              <span>{snap.revenueAudit.tiebreakCount}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
              <span className="text-gray-400">Tiebreak rate</span>
              <span>{pct(snap.revenueAudit.tiebreakRate)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
              <span className="text-gray-400">Correlation score</span>
              <span>{snap.revenueAudit.correlationScore.toFixed(3)} <span className="text-gray-600">(target: &lt; 0.20)</span></span>
            </div>
          </div>
        </section>

        {/* Category health */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Category Health</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-600">
                  <th className="py-2 pr-6">Category</th>
                  <th className="py-2 pr-6">Impressions</th>
                  <th className="py-2 pr-6">CTR</th>
                  <th className="py-2 pr-6">Conv. Rate</th>
                  <th className="py-2">Top Products</th>
                </tr>
              </thead>
              <tbody>
                {snap.categoryHealth.map((h) => (
                  <tr key={h.category} className="border-b border-gray-800/50">
                    <td className="py-2.5 pr-6 capitalize font-medium text-white">{h.category}</td>
                    <td className="py-2.5 pr-6 text-gray-400">{h.impressions}</td>
                    <td className="py-2.5 pr-6 text-gray-400">{pct(h.ctr)}</td>
                    <td className="py-2.5 pr-6 text-gray-400">{pct(h.conversionRate)}</td>
                    <td className="py-2.5 text-gray-600 text-xs">{h.topProductIds.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ranking divergence */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">V15 → V16 Divergence</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-600">
                  <th className="py-2 pr-6">Category</th>
                  <th className="py-2 pr-6">CTR Δ</th>
                  <th className="py-2 pr-6">Revenue Δ</th>
                  <th className="py-2">Dwell Δ (s)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(snap.rankingDivergence).map(([cat, d]) => (
                  <tr key={cat} className="border-b border-gray-800/50">
                    <td className="py-2.5 pr-6 capitalize font-medium text-white">{cat}</td>
                    <td className={`py-2.5 pr-6 ${d.ctrDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {delta(d.ctrDelta)}
                    </td>
                    <td className={`py-2.5 pr-6 ${d.revenueDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {delta(d.revenueDelta)}
                    </td>
                    <td className={`py-2.5 ${d.dwellDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {d.dwellDelta >= 0 ? "+" : ""}{d.dwellDelta.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 text-xs text-gray-700">
          /admin/v16 · server-rendered · no authentication · restrict via Vercel or middleware
        </footer>
      </div>
    </div>
  );
}
