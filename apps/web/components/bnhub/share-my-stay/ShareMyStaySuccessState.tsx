"use client";

import { CheckCircle2 } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";

export function ShareMyStaySuccessState() {
  const { successOpen, setSuccessOpen, copyShareLink, busy, session, openManage } = useShareMyStay();

  if (!successOpen) return null;

  const expiresLabel = session?.expiresAt
    ? new Date(session.expiresAt).toLocaleString()
    : "the time shown in your active share card";

  function viewStatus() {
    setSuccessOpen(false);
    openManage();
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-success-title"
      onClick={(e) => e.target === e.currentTarget && setSuccessOpen(false)}
    >
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden />
          </div>
          <h3 id="share-success-title" className="mt-4 text-xl font-semibold text-white">
            Sharing started
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Your secure share link is active until <span className="font-medium text-slate-300">{expiresLabel}</span>.
            Copy it below and send it with your own email or messages.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void copyShareLink()}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={viewStatus}
            className="w-full rounded-xl border border-slate-600 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            View sharing status
          </button>
          <button
            type="button"
            onClick={() => setSuccessOpen(false)}
            className="w-full rounded-xl border border-transparent py-3 text-sm font-medium text-slate-400 hover:text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
