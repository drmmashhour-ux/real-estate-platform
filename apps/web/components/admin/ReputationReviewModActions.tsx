"use client";

import { useState } from "react";
import type { ReviewStatus } from "@prisma/client";

const STATUSES: ReviewStatus[] = ["pending", "published", "hidden", "flagged"];

export function ReputationReviewModActions({ reviewId }: { reviewId: string }) {
  const [status, setStatus] = useState<ReviewStatus>("published");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/reputation/reviews/${reviewId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setMsg("Saved.");
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ReviewStatus)}
        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded bg-zinc-700 px-3 py-1 text-xs text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        Save
      </button>
      {msg ? <span className="text-xs text-zinc-400">{msg}</span> : null}
    </div>
  );
}
