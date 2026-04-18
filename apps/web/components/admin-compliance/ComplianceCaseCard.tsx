import type { ComplianceCase, ComplianceFinding } from "@prisma/client";

type CaseRow = ComplianceCase & {
  complianceFindings: ComplianceFinding[];
  deal: { id: string; dealCode: string | null; status: string; brokerId: string | null } | null;
};

const SEVERITY_RING: Record<string, string> = {
  critical: "ring-red-500/50",
  high: "ring-orange-500/40",
  medium: "ring-amber-500/35",
  low: "ring-zinc-600",
};

export function ComplianceCaseCard({
  row,
  selected,
  onSelect,
}: {
  row: CaseRow;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const ring = SEVERITY_RING[row.severity] ?? SEVERITY_RING.low;
  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      className={`w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 text-left ring-1 transition hover:border-amber-500/25 ${
        selected ? "ring-2 ring-amber-400/50" : ring
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{row.caseType.replace(/_/g, " ")}</p>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-100">{row.summary}</p>
        </div>
        <span className="shrink-0 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200/90">
          {row.severity}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
        <span>Status: {row.status}</span>
        {row.deal?.dealCode && <span>Deal {row.deal.dealCode}</span>}
        <span>{row.complianceFindings.length} findings</span>
      </div>
    </button>
  );
}
