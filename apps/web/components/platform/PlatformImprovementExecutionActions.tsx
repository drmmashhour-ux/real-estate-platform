"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PlatformImprovementQuickAction } from "@/modules/platform/platform-improvement-operator-transitions";
import type { PlatformPriorityStatus } from "@/modules/platform/platform-improvement.types";

const btn =
  "rounded border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40 disabled:pointer-events-none";

export function PlatformImprovementExecutionActions({
  priorityId,
  status,
  compact = false,
}: {
  priorityId: string;
  status: PlatformPriorityStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fire = async (action: PlatformImprovementQuickAction) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/improvement-review/priority-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorityId, action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const gap = compact ? "gap-1" : "gap-1.5";

  return (
    <div className={`flex flex-wrap ${gap}`}>
      {status === "new" ? (
        <>
          <button type="button" disabled={busy} className={`${btn} border-sky-700 bg-sky-950/50 text-sky-200 hover:bg-sky-900/60`} onClick={() => void fire("acknowledge")}>
            Acknowledge
          </button>
          <button type="button" disabled={busy} className={`${btn} border-zinc-600 bg-zinc-900 text-zinc-300 hover:bg-zinc-800`} onClick={() => void fire("dismiss")}>
            Dismiss
          </button>
        </>
      ) : null}

      {status === "acknowledged" ? (
        <>
          <button type="button" disabled={busy} className={`${btn} border-violet-700 bg-violet-950/40 text-violet-200 hover:bg-violet-900/50`} onClick={() => void fire("plan")}>
            Plan
          </button>
          <button type="button" disabled={busy} className={`${btn} border-zinc-600 bg-zinc-900 text-zinc-300 hover:bg-zinc-800`} onClick={() => void fire("dismiss")}>
            Dismiss
          </button>
        </>
      ) : null}

      {status === "planned" ? (
        <>
          <button type="button" disabled={busy} className={`${btn} border-amber-700 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50`} onClick={() => void fire("start")}>
            Start
          </button>
          <button type="button" disabled={busy} className={`${btn} border-zinc-600 bg-zinc-900 text-zinc-300 hover:bg-zinc-800`} onClick={() => void fire("dismiss")}>
            Dismiss
          </button>
        </>
      ) : null}

      {status === "in_progress" ? (
        <>
          <button type="button" disabled={busy} className={`${btn} border-emerald-700 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50`} onClick={() => void fire("done")}>
            Mark done
          </button>
          <button type="button" disabled={busy} className={`${btn} border-zinc-600 bg-zinc-900 text-zinc-300 hover:bg-zinc-800`} onClick={() => void fire("dismiss")}>
            Dismiss
          </button>
        </>
      ) : null}

      {status === "done" || status === "dismissed" ? (
        <button type="button" disabled={busy} className={`${btn} border-sky-700 bg-sky-950/50 text-sky-200 hover:bg-sky-900/60`} onClick={() => void fire("reopen")}>
          Reopen
        </button>
      ) : null}

      {error ? <span className="w-full text-[11px] text-red-400">{error}</span> : null}
    </div>
  );
}
