import type { NextBestAction } from "@/modules/deal-autopilot/deal-autopilot.types";

export function DealAutopilotCard({ action }: { action: NextBestAction }) {
  return (
    <li className="rounded-xl border border-ds-border bg-ds-card/50 p-4 shadow-ds-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-medium text-ds-text">{action.title}</h4>
        <span className="text-[10px] uppercase tracking-wide text-ds-gold/90">{action.urgency}</span>
      </div>
      <p className="mt-2 text-sm text-ds-text-secondary">{action.summary}</p>
      <p className="mt-2 text-xs text-ds-text-secondary">
        <span className="text-ds-gold">Why:</span> {action.whyItMatters}
      </p>
      <p className="mt-1 text-xs text-ds-text-secondary">
        <span className="text-ds-gold">Risk if ignored:</span> {action.riskIfIgnored}
      </p>
      <p className="mt-2 text-sm text-ds-text">
        <span className="text-ds-gold">Suggested:</span> {action.suggestedAction}
      </p>
      {action.brokerApprovalRequired ? (
        <p className="mt-2 text-[11px] text-amber-200/80">Broker confirmation suggested before external steps.</p>
      ) : null}
    </li>
  );
}
