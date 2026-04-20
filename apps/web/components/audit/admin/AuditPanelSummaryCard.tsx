import type { AuditPanelPayload } from "@/modules/audit/audit-panel.service";

export function AuditPanelSummaryCard({ panel }: { panel: AuditPanelPayload | null }) {
  if (!panel) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-500">No audit data.</div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 text-xs text-zinc-300">
      <p className="font-semibold text-zinc-100">{panel.statusSummary}</p>
      <p className="mt-2 text-zinc-500">Scope: {panel.scopeType}</p>
      <p className="mt-1 font-mono text-[10px] text-zinc-600">generatedAt: {panel.generatedAt}</p>
      {panel.previewReasoningSummary ? (
        <p className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-400">
          Preview reasoning: {panel.previewReasoningSummary}
        </p>
      ) : null}
      {panel.certificateOfLocationAudit ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="font-semibold text-amber-400/95">Certificate of location (broker helper)</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Status {panel.certificateOfLocationAudit.status} · readiness {panel.certificateOfLocationAudit.readinessLevel}{" "}
            · risk {panel.certificateOfLocationAudit.riskLevel}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Blocking issues: {panel.certificateOfLocationAudit.blockingIssueCount} — advisory only, not legal advice.
          </p>
          {panel.certificateOfLocationAudit.blockingIssuesPreview.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-[11px] text-zinc-500">
              {panel.certificateOfLocationAudit.blockingIssuesPreview.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
