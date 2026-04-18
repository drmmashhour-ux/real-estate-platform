"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = { leadId: string };

export function FollowUpLeadRowActions({ leadId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: "mark_done" | "snooze" | "requeue") => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/autopilot/followup/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ leadId, action }),
        });
        if (!res.ok) return;
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [leadId, router],
  );

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run("mark_done")}
        className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        Mark done
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run("snooze")}
        className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        Snooze 24h
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run("requeue")}
        className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        Re-queue
      </button>
    </div>
  );
}
