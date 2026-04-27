"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  label?: string;
};

export function ApplySafeBatchButton({ listingId, label = "Apply all safe improvements" }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function applyAll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/apply-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = (await res.json()) as { applied?: number; error?: string; ok?: boolean; executeResult?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Request failed");
        return;
      }
      if (data.ok && (data.applied ?? 0) > 0) {
        setMessage(`Applied ${data.applied} update(s).`);
        window.setTimeout(() => window.location.reload(), 600);
        return;
      }
      if (data.executeResult && data.executeResult !== "ok") {
        setMessage(`Could not apply: ${data.executeResult}`);
        return;
      }
      setMessage("No safe auto-apply items for this listing.");
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      <button
        type="button"
        onClick={applyAll}
        disabled={loading}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Applying…" : label}
      </button>
      {message ? <span className="text-xs text-slate-600">{message}</span> : null}
    </div>
  );
}
