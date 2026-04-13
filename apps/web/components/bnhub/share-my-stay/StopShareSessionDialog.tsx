"use client";

import { AlertTriangle } from "lucide-react";
import { useShareMyStay } from "./ShareMyStayContext";

export function StopShareSessionDialog() {
  const { stopDialogOpen, setStopDialogOpen, stopSession, busy } = useShareMyStay();

  if (!stopDialogOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[92] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-share-title"
      onClick={(e) => e.target === e.currentTarget && setStopDialogOpen(false)}
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
            <AlertTriangle className="h-5 w-5 text-rose-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 id="stop-share-title" className="text-lg font-semibold text-white">
              Stop sharing?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              The secure link will stop working immediately. People with the old link will no longer see your stay.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setStopDialogOpen(false)}
            className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 sm:min-w-[100px]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void stopSession()}
            className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 sm:min-w-[120px]"
          >
            {busy ? "Stopping…" : "Stop now"}
          </button>
        </div>
      </div>
    </div>
  );
}
