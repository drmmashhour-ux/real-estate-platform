"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DealAnalysisRunButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("err");
        setMsg(j.error ?? "Could not run analysis");
        return;
      }
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("err");
      setMsg("Network error");
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void run()}
        disabled={status === "loading"}
        className="rounded-full border border-premium-gold/50 bg-premium-gold/10 px-4 py-2 text-xs font-semibold text-premium-gold transition hover:bg-premium-gold/20 disabled:opacity-50"
      >
        {status === "loading" ? "Running…" : "Run deal analysis"}
      </button>
      {msg ? <p className="mt-2 text-xs text-red-300">{msg}</p> : null}
    </div>
  );
}
