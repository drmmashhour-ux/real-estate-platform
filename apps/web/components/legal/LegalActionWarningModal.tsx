"use client";

import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

export function LegalActionWarningModal({
  open,
  title = "Content usage check",
  message,
  onCancel,
  onConfirm,
  confirmLabel = "I understand — continue",
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="legal-warn-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-[#121212] p-6 shadow-2xl">
        <h2 id="legal-warn-title" className="text-lg font-semibold text-amber-100">
          {title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{message}</p>
        <div className="mt-4">
          <LegalAiDisclaimer />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            onClick={onCancel}
          >
            Go back
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
