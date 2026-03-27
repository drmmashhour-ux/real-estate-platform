"use client";

import type { ClientSectionExplanation } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

export function ExplainDrawer({
  open,
  explanation,
  onClose,
}: {
  open: boolean;
  explanation: ClientSectionExplanation | null;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#141518] p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white">Explanation</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            Close
          </button>
        </div>
        {explanation ? (
          <div className="mt-3 space-y-3 text-xs text-slate-300">
            <div>
              <p className="font-medium text-slate-200">What it means</p>
              <p className="mt-1 leading-relaxed">{explanation.whatItMeans}</p>
            </div>
            <div>
              <p className="font-medium text-slate-200">Why it matters</p>
              <p className="mt-1 leading-relaxed">{explanation.whyItMatters}</p>
            </div>
            <div>
              <p className="font-medium text-slate-200">What to check</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {explanation.whatToCheck.map((line, idx) => (
                  <li key={`${idx}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            </div>
            <p className="rounded-md border border-white/10 bg-black/30 p-2 text-[11px] text-slate-500">{explanation.disclaimer}</p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Loading…</p>
        )}
      </div>
    </div>
  );
}
