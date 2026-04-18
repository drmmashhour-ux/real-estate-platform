"use client";

import { useState } from "react";

type Props = {
  submissionId: string;
};

export function MarkLeadHandledButton({ submissionId }: Props) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/growth/early-conversion-lead/${submissionId}/handled`, {
        method: "PATCH",
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <span className="text-xs text-emerald-400">Marked handled</span>;
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={mark}
      className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
    >
      {busy ? "…" : "Mark handled"}
    </button>
  );
}
