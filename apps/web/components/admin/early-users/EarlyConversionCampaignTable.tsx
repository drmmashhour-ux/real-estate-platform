import {
  computeAdsPerformanceHealth,
  fetchEarlyConversionAdsSnapshot,
} from "@/modules/growth/growth-ai-analyzer.service";

/**
 * Groups /get-leads (early_conversion_lead) submissions by utm_campaign for paid traffic review.
 */
export async function EarlyConversionCampaignTable() {
  const snap = await fetchEarlyConversionAdsSnapshot();
  const health = computeAdsPerformanceHealth(snap.leadsToday);
  const healthLabel = health === "STRONG" ? "STRONG" : health === "OK" ? "OK" : "WEAK";
  const total = Math.max(1, snap.totalLeads);
  const topLabel = snap.campaignCounts[0]?.label ?? "";

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Get-leads campaigns (UTM)</h2>
        <p className="text-xs text-slate-400">
          📊 Ads Performance: <span className="font-semibold text-slate-200">{healthLabel}</span> · {snap.leadsToday}{" "}
          lead{snap.leadsToday === 1 ? "" : "s"} today
        </p>
      </div>
      <p className="text-xs text-slate-500">
        Grouped by <code className="rounded bg-slate-800 px-1">utm_campaign</code> from{" "}
        <code className="rounded bg-slate-800 px-1">/get-leads</code> submissions.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[420px] text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2">Campaign (utm_campaign)</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">% of total</th>
            </tr>
          </thead>
          <tbody>
            {snap.campaignCounts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  No get-leads submissions yet.
                </td>
              </tr>
            ) : (
              snap.campaignCounts.map((row) => {
                const pct = (row.count / total) * 100;
                const isTop = row.label === topLabel && row.count > 0;
                return (
                  <tr key={row.label} className="border-b border-slate-800">
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{row.label}</span>
                      {isTop ? (
                        <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                          🔥 Top performer
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2 text-slate-400">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
