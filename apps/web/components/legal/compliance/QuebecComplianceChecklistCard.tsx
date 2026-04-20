"use client";

import { QuebecComplianceIssuesList } from "./QuebecComplianceIssuesList";
import { QuebecComplianceStatusBadge } from "./QuebecComplianceStatusBadge";

export type QuebecComplianceCardModel = {
  readinessScore: number;
  allowed: boolean;
  blockingIssueIds: string[];
  checklistSummary: Array<{
    itemId: string;
    passed: boolean;
    label: string;
    severity: "info" | "warning" | "critical";
    blocking: boolean;
  }>;
};

export function QuebecComplianceChecklistCard({
  title = "Québec compliance checklist",
  model,
}: {
  title?: string;
  model: QuebecComplianceCardModel | null;
}) {
  if (!model) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-slate-300">
        <p className="text-sm">Québec compliance data is unavailable for this listing (feature off or listing not loaded).</p>
      </section>
    );
  }

  const blocking = model.checklistSummary.filter((i) => i.blocking && !i.passed);
  const advisory = model.checklistSummary.filter((i) => !i.blocking && !i.passed);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Deterministic checklist for Québec-targeted workflows — document contents are never shown here.
          </p>
        </div>
        <QuebecComplianceStatusBadge readinessScore={model.readinessScore} allowed={model.allowed} />
      </div>

      {model.blockingIssueIds.length > 0 ? (
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <p className="font-semibold text-rose-200">Blocking items</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {model.blockingIssueIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-semibold text-white">Items</p>
        <QuebecComplianceIssuesList
          issues={model.checklistSummary.map((r) => ({
            id: r.itemId,
            label: r.label,
            passed: r.passed,
            severity: r.severity,
            blocking: r.blocking,
          }))}
        />
      </div>

      {advisory.length > 0 ? (
        <p className="mt-4 text-xs text-slate-500">{advisory.length} advisory item(s) still open — complete where applicable.</p>
      ) : null}

      {blocking.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">{blocking.length} required item(s) still need verification or correction.</p>
      ) : null}
    </section>
  );
}
