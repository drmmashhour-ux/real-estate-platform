"use client";

import type { QuebecListingComplianceEvaluationResult } from "@/modules/legal/compliance/quebec-listing-compliance-evaluator.service";

export function QuebecComplianceChecklistCard({ evaluation }: { evaluation: QuebecListingComplianceEvaluationResult | null }) {
  if (!evaluation) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4 text-sm text-zinc-400">
        Compliance checklist not evaluated.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/25 bg-zinc-950 p-4 text-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Québec publish readiness</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {evaluation.readinessScore}
        <span className="ml-2 text-sm font-normal text-zinc-400">/ 100</span>
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Checklist passed:{" "}
        <span className={evaluation.requiredChecklistPassed ? "text-emerald-400" : "text-amber-300"}>
          {evaluation.requiredChecklistPassed ? "yes" : "no"}
        </span>
      </p>
    </div>
  );
}
