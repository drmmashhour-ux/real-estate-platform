"use client";

import WorkflowCard from "@/components/copilot/WorkflowCard";
import type { WorkflowClientDto } from "@/lib/workflows/dto";
import type { CopilotResponse as CopilotResponseType } from "@/modules/copilot/domain/copilotTypes";

type Props = {
  response: CopilotResponseType | null;
  error: string | null;
  loading: boolean;
  workflow?: WorkflowClientDto | null;
  workflowError?: string | null;
};

/** Renders a structured Copilot API response (deterministic content only). */
export function CopilotResponseView({ response, error, loading, workflow, workflowError }: Props) {
  if (loading) {
    return <p className="text-sm text-ds-text-secondary">Thinking…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-400/95">{error}</p>;
  }
  if (!response) {
    return <p className="text-sm text-ds-text-secondary">Results appear here.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-ds-border bg-ds-card/90 p-4 text-sm text-ds-text shadow-ds-soft backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-ds-gold/35 bg-ds-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ds-gold">
          {response.intent.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-ds-text-secondary">Confidence: {response.confidence}</span>
      </div>
      <p className="leading-relaxed text-ds-text">{response.summary}</p>
      {response.insights.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-secondary">Insights</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-ds-text-secondary">
            {response.insights.map((line) => (
              <li key={line.slice(0, 80)}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.warnings.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">Notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-200/85">
            {response.warnings.map((w) => (
              <li key={w.slice(0, 80)}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {response.actions.map((a) =>
            a.href ? (
              <a
                key={a.id}
                href={a.href}
                className="rounded-lg border border-ds-border bg-ds-surface px-3 py-1.5 text-xs font-medium text-ds-gold transition-colors hover:border-ds-gold/40 hover:bg-ds-gold/5"
              >
                {a.label}
              </a>
            ) : (
              <span key={a.id} className="rounded-lg border border-ds-border/80 px-3 py-1.5 text-xs text-ds-text-secondary">
                {a.label}
              </span>
            ),
          )}
        </div>
      ) : null}
      {workflowError ? (
        <p className="text-xs text-amber-200/90">Workflow planner blocked: {workflowError}</p>
      ) : null}
      {workflow ? <WorkflowCard initial={workflow} /> : null}
    </div>
  );
}
