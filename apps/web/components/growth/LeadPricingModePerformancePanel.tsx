import { leadPricingResultsFlags } from "@/config/feature-flags";
import { buildLeadPricingModePerformance } from "@/modules/leads/lead-pricing-results.service";

/** Admin growth — aggregate lead pricing observation outcomes by advisory mode (evaluated rows only). */
export async function LeadPricingModePerformancePanel() {
  if (!leadPricingResultsFlags.leadPricingResultsV1) return null;

  const rows = await buildLeadPricingModePerformance();
  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-amber-500/20 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-semibold text-white">Lead pricing mode performance</h2>
        <p className="mt-2 text-sm text-zinc-400">
          No evaluated pricing observations yet — bands appear after operators persist evaluations on lead records.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-zinc-950/80 p-5">
      <h2 className="text-lg font-semibold text-white">Lead pricing mode performance</h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">
        Internal audit roll-up of evaluated observations by advisory lane — association across modes only, not proof that
        a lane type caused CRM outcomes. Low counts inflate how strong the sample-strength label looks; read case totals
        first.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2 pr-3">Cases</th>
              <th className="py-2 pr-3">Positive</th>
              <th className="py-2 pr-3">Neutral</th>
              <th className="py-2 pr-3">Negative</th>
              <th className="py-2 pr-3">Insufficient</th>
              <th className="py-2 pr-3">Positive share (scored)</th>
              <th className="py-2">Sample strength</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mode} className="border-b border-white/5">
                <td className="py-2 pr-3 font-medium text-white">{r.mode.replace(/_/g, " ")}</td>
                <td className="py-2 pr-3 tabular-nums">{r.totalCases}</td>
                <td className="py-2 pr-3 tabular-nums">{r.positiveCount}</td>
                <td className="py-2 pr-3 tabular-nums">{r.neutralCount}</td>
                <td className="py-2 pr-3 tabular-nums">{r.negativeCount}</td>
                <td className="py-2 pr-3 tabular-nums">{r.insufficientCount}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {r.successRate == null ? "—" : `${Math.round(r.successRate * 100)}%`}
                </td>
                <td className="py-2 capitalize text-amber-100/90">{r.confidenceLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
