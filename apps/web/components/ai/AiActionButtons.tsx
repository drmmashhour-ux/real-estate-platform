"use client";

import { useState } from "react";

type AiActionButtonsProps = {
  queueItemId: string | null;
  recommendedAction: string | null;
  autoMode: boolean;
  onAction: (action: "approve" | "flag" | "block" | "escalate") => Promise<void>;
  onDone?: () => void;
};

export function AiActionButtons({
  queueItemId,
  recommendedAction,
  autoMode,
  onAction,
  onDone,
}: AiActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: "approve" | "flag" | "block" | "escalate") {
    if (!queueItemId) return;
    setLoading(action);
    try {
      await onAction(action);
      onDone?.();
    } finally {
      setLoading(null);
    }
  }

  if (!queueItemId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-xs text-slate-500 dark:text-slate-400">Select an item to enable actions.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {autoMode ? "AUTO-MODE: AI may execute decisions automatically." : "Suggest-only: apply actions manually."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handle("approve")}
          disabled={!!loading}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => handle("flag")}
          disabled={!!loading}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-50"
        >
          {loading === "flag" ? "…" : "Flag"}
        </button>
        <button
          type="button"
          onClick={() => handle("block")}
          disabled={!!loading}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading === "block" ? "…" : "Block"}
        </button>
        <button
          type="button"
          onClick={() => handle("escalate")}
          disabled={!!loading}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {loading === "escalate" ? "…" : "Escalate to human"}
        </button>
      </div>
      {recommendedAction && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          AI recommends: <span className="font-medium text-slate-700 dark:text-slate-300">{recommendedAction}</span>
        </p>
      )}
    </div>
  );
}
