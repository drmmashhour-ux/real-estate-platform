"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GrowthOpsSpendForm() {
  const router = useRouter();
  const [utmCampaign, setUtmCampaign] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [spendDollars, setSpendDollars] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/growth-ops/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utmCampaign,
          periodStart,
          periodEnd,
          spendDollars: parseFloat(spendDollars),
          note: note || undefined,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Save failed");
        return;
      }
      setUtmCampaign("");
      setPeriodStart("");
      setPeriodEnd("");
      setSpendDollars("");
      setNote("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-sm font-medium text-slate-200">Add spend row</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          utm_campaign
          <input
            required
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="e.g. bnhub_mtl_q1"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Spend (CAD)
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={spendDollars}
            onChange={(e) => setSpendDollars(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="250.00"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Period start (UTC date)
          <input
            required
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Period end (inclusive)
          <input
            required
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <label className="block text-xs text-slate-400">
        Note (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save spend"}
      </button>
    </form>
  );
}
