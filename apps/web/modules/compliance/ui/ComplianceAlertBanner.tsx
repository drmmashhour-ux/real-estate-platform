"use client";

import type { ComplianceDecision } from "@/modules/compliance/core/decision";

export function ComplianceAlertBanner(props: { decision: ComplianceDecision; onDismiss?: () => void }) {
  if (props.decision.status === "compliant") return null;

  const tone =
    props.decision.status === "blocked"
      ? "border-red-600 bg-red-950/60 text-red-100"
      : props.decision.status === "review_required"
        ? "border-amber-600 bg-amber-950/50 text-amber-100"
        : "border-yellow-700 bg-yellow-950/40 text-yellow-100";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">Compliance</div>
          <div className="text-lg font-semibold mt-1">
            {props.decision.status === "blocked"
              ? "Progression blocked"
              : props.decision.status === "review_required"
                ? "Manual review required"
                : "Warnings present"}
          </div>
          <p className="text-sm mt-2 opacity-90">
            Worst severity: <strong>{props.decision.worstSeverity}</strong>. Final approval rests with the licensed
            broker or authorized compliance officer — no silent automation.
          </p>
          {props.decision.blockingFailures.length ? (
            <ul className="mt-2 text-sm list-disc list-inside space-y-1">
              {props.decision.blockingFailures.map((f) => (
                <li key={f.ruleId}>
                  {f.title}: {f.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {props.onDismiss ? (
          <button type="button" className="text-xs underline opacity-80 h-fit" onClick={props.onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
