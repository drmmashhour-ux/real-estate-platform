import { memo } from "react";
import type { CaseSignatureReadinessStatus } from "@/src/modules/case-command-center/domain/case.types";

const label: Record<CaseSignatureReadinessStatus, string> = {
  not_ready: "Not ready",
  almost_ready: "Almost ready",
  ready: "Ready",
};

export const CaseSignatureReadiness = memo(function CaseSignatureReadiness({
  status,
  checklist,
}: {
  status: CaseSignatureReadinessStatus;
  checklist: Array<{ id: string; label: string; done: boolean }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">Signature readiness</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            status === "ready"
              ? "bg-emerald-500/20 text-emerald-200"
              : status === "almost_ready"
                ? "bg-amber-500/20 text-amber-200"
                : "bg-slate-500/20 text-slate-300"
          }`}
        >
          {label[status]}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {checklist.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-xs text-slate-300">
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${c.done ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" : "border-white/15 text-slate-600"}`}>
              {c.done ? "✓" : ""}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
});
