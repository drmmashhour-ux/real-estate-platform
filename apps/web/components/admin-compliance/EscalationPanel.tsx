import type { ComplianceCase, ComplianceEscalation } from "@prisma/client";

type Row = ComplianceEscalation & {
  complianceCase: Pick<ComplianceCase, "id" | "summary" | "severity" | "dealId" | "status">;
};

export function EscalationPanel({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Escalations</h2>
      <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <li className="text-sm text-zinc-500">No escalations recorded.</li>
        ) : (
          rows.map((e) => (
            <li key={e.id} className="rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-200">{e.escalationType.replace(/_/g, " ")}</span>
                <span className="text-[10px] uppercase text-zinc-500">{e.status}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Target: {e.targetRole}</p>
              {e.complianceCase?.summary && (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{e.complianceCase.summary}</p>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
