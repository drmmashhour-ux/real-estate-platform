"use client";

import type { AutonomousTaskOutput } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.types";
import { LECIPM_SUPPORTING_WORKFLOW_CAPTION } from "@/src/modules/case-command-center/application/lecipmTrustCopy";

/** Secondary detail only — primary next action lives in CaseNextActions (case health snapshot). */
export function WorkflowRecommendationsCard({ steps }: { steps: AutonomousTaskOutput[] }) {
  if (!steps.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Workflow detail</p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{LECIPM_SUPPORTING_WORKFLOW_CAPTION}</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-400">
        {steps.map((s) => (
          <li key={`${s.taskType}-${s.summary}`} className="rounded-md border border-white/5 bg-black/30 p-2">
            <p className="font-medium text-slate-300">{s.summary}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.recommendedAction}</p>
            {s.requiresApproval ? <p className="mt-1 text-[10px] text-amber-200/70">Requires human approval — not auto-executed.</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
