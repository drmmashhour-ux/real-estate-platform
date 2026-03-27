"use client";

type Usage = {
  workspaceId: string;
  activeMembers: number;
  copilotRuns: number;
  trustgraphRunsFromAudit: number;
  dealAnalysesFromAudit: number;
  auditActionCounts: { action: string; count: number }[];
};

export function WorkspaceUsagePanel({ usage }: { usage: Usage }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Active members" value={String(usage.activeMembers)} />
      <Metric label="Copilot runs" value={String(usage.copilotRuns)} />
      <Metric label="TrustGraph runs (audit)" value={String(usage.trustgraphRunsFromAudit)} />
      <Metric label="Deal analyses (audit)" value={String(usage.dealAnalysesFromAudit)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
