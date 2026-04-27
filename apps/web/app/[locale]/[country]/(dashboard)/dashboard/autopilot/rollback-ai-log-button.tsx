"use client";

import { useState } from "react";

type Props = {
  logId: string;
};

export function RollbackAiLogButton({ logId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function rollback() {
    if (typeof window !== "undefined" && !window.confirm("Undo this AI price change?")) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setMessage(data.error ?? "Request failed");
        return;
      }
      if (data.ok) {
        setMessage("Restored previous value.");
        window.setTimeout(() => window.location.reload(), 500);
        return;
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={rollback}
        disabled={loading}
        className="text-xs font-semibold text-amber-800 hover:underline disabled:opacity-50"
      >
        {loading ? "Restoring…" : "Undo change"}
      </button>
      {message ? <span className="text-[11px] text-slate-500">{message}</span> : null}
    </div>
  );
}
