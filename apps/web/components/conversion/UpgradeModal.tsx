"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  reason?: string;
};

export function UpgradeModal({ open, onClose, reason }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-slate-100">Unlock Pro conversion tools</h3>
        <p className="mt-2 text-sm text-slate-300">
          {reason ?? "You reached an action threshold. Upgrade for premium insights and faster deal execution."}
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="/pricing"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
          >
            Upgrade now
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
