import type { LegalGraphSummary } from "@/src/modules/legal-intelligence-graph/domain/legalGraph.types";
import { FileHealthBadge } from "@/src/modules/legal-intelligence-graph/ui/FileHealthBadge";

export function LegalGraphSummaryCard({ summary }: { summary: LegalGraphSummary | null }) {
  if (!summary) return <p className="text-xs text-slate-500">Legal graph summary unavailable.</p>;
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Legal file health</p>
        <FileHealthBadge health={summary.fileHealth} />
      </div>
      <p className="mt-2 text-xs text-slate-300">Blocking issues: {summary.blockingIssues.length}</p>
      <p className="text-xs text-slate-300">Missing dependencies: {summary.missingDependencies.length}</p>
    </div>
  );
}
