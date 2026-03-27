import { memo } from "react";
import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";
import { CaseHealthScore } from "@/src/modules/case-command-center/ui/CaseHealthScore";

export const CaseHeader = memo(function CaseHeader({ snapshot }: { snapshot: CaseHealthSnapshot }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0c0d10] via-black/30 to-black/50 p-4 ring-1 ring-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Case Command Center</p>
          <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">{snapshot.propertyTitle}</h1>
          <p className="text-xs text-slate-400">{snapshot.propertyAddressLine}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Doc · {snapshot.documentId}</p>
        </div>
        <CaseHealthScore score={snapshot.score} status={snapshot.status} />
      </div>
    </div>
  );
});
