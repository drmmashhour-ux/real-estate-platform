"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListingQualityRecomputeButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(`/api/quality/recompute/${encodeURIComponent(listingId)}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Request failed");
      setStatus("done");
      setMessage("Scores updated.");
      router.refresh();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={status === "loading"}
        className="inline-flex min-h-[44px] max-w-xs items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {status === "loading" ? "Recomputing…" : "Recompute now"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
