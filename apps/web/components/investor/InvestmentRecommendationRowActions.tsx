"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvestmentRecommendationRowActions({ recommendationId }: { recommendationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function post(path: string) {
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => post(`/api/investment/recommendations/${encodeURIComponent(recommendationId)}/apply`)}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50"
      >
        Mark applied
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => post(`/api/investment/recommendations/${encodeURIComponent(recommendationId)}/dismiss`)}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 disabled:opacity-50"
      >
        Dismiss
      </button>
    </div>
  );
}
