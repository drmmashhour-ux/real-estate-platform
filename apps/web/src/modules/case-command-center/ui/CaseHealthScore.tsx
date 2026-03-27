import { memo } from "react";
import type { CaseHealthStatus } from "@/src/modules/case-command-center/domain/case.types";

const statusStyle: Record<CaseHealthStatus, string> = {
  critical: "bg-rose-500/20 text-rose-200 ring-rose-500/40",
  attention: "bg-amber-500/20 text-amber-200 ring-amber-400/35",
  ready: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
};

export const CaseHealthScore = memo(function CaseHealthScore({ score, status }: { score: number; status: CaseHealthStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-xl font-semibold tabular-nums text-white">
        {score}
      </div>
      <div>
        <p className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${statusStyle[status]}`}>
          {status === "critical" ? "Critical" : status === "attention" ? "Needs attention" : "Ready"}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">Health score (0–100)</p>
      </div>
    </div>
  );
});
