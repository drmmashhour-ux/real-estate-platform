import { memo } from "react";
import type { CaseDocumentPanelState } from "@/src/modules/case-command-center/domain/case.types";

function StateChip({ label, state }: { label: string; state: CaseDocumentPanelState }) {
  const cls =
    state === "complete"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
      : state === "blocked"
        ? "bg-rose-500/15 text-rose-200 ring-rose-500/35"
        : "bg-slate-500/15 text-slate-300 ring-white/10";
  const word = state === "complete" ? "Complete" : state === "blocked" ? "Blocked" : "Incomplete";
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${cls}`}>{word}</span>
    </div>
  );
}

export const CaseDocumentsStatus = memo(function CaseDocumentsStatus({
  panels,
  signatures,
}: {
  panels: {
    sellerDeclaration: CaseDocumentPanelState;
    contract: CaseDocumentPanelState;
    review: CaseDocumentPanelState;
  };
  signatures: Array<{ signerName: string; status: string }>;
}) {
  const sigPreview = signatures.slice(0, 5);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Document status</p>
      <div className="mt-3 space-y-2">
        <StateChip label="Seller declaration" state={panels.sellerDeclaration} />
        <StateChip label="Contract" state={panels.contract} />
        <StateChip label="Review" state={panels.review} />
      </div>
      {sigPreview.length ? (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Signatures</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-400">
            {sigPreview.map((s) => (
              <li key={`${s.signerName}-${s.status}`}>
                {s.signerName}: {s.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
});
