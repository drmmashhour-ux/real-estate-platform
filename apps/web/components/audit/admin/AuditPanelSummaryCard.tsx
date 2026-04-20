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
    </div>
  );
}
