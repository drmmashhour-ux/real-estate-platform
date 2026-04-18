import Link from "next/link";
import type { WorkloadInsight } from "@/modules/broker-workload/workload.types";

type Summary = Awaited<ReturnType<typeof import("@/modules/broker-workload/workload.service").getBrokerWorkloadSummary>>;

export function WorkloadBoard({
  basePath,
  summary,
  suggestions,
}: {
  basePath: string;
  summary: Summary;
  suggestions: WorkloadInsight[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl text-ds-text">Workload</h2>
        <p className="mt-1 text-xs text-ds-text-secondary">
          Heuristic signals only — triage with your internal supervision policies.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open tasks", summary.openTasks],
          ["Doc reviews", summary.pendingDocumentReviews],
          ["Assignments", summary.activeAssignments],
          ["Active deals", summary.activeDeals],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl border border-ds-border bg-ds-card/50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ds-text-secondary">{label}</p>
            <p className="mt-1 font-serif text-2xl text-ds-text">{val}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ds-text-secondary">Bottlenecks</h3>
        <div className="space-y-2">
          {summary.bottlenecks.length === 0 ? (
            <p className="text-sm text-ds-text-secondary">No major bottlenecks detected from current heuristics.</p>
          ) : (
            summary.bottlenecks.map((b, i) => (
              <div key={i} className="rounded-lg border border-amber-900/40 bg-black/40 px-4 py-3 text-sm">
                <p className="font-medium text-ds-text">{b.title}</p>
                <p className="mt-1 text-xs text-ds-text-secondary">{b.summary}</p>
                <p className="mt-2 text-xs text-amber-200/80">{b.recommendedAction}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ds-text-secondary">Rebalance suggestions</h3>
        {suggestions.length === 0 ? (
          <p className="text-sm text-ds-text-secondary">No team-level suggestions (requires an active team with members).</p>
        ) : (
          <ul className="space-y-2 text-sm text-ds-text-secondary">
            {suggestions.map((s, i) => (
              <li key={i} className="rounded-lg border border-ds-border bg-ds-card/40 px-3 py-2">
                {s.title}: {s.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`${basePath}/kpis`} className="inline-block text-xs text-ds-gold hover:underline">
        ← KPI board
      </Link>
    </div>
  );
}
