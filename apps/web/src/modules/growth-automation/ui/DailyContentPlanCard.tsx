"use client";

import { useState } from "react";

export function DailyContentPlanCard() {
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [planJson, setPlanJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/plan/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDate: new Date().toISOString().slice(0, 10),
          focus: focus.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlanJson(JSON.stringify(data.plan, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Daily content plan</h3>
      <p className="mt-1 text-xs text-slate-500">Topic, angle, platforms, CTA, hooks (review before scheduling).</p>
      <input
        className="mt-3 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        placeholder="Optional focus (e.g. financing conditions)"
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
      />
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="mt-2 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate plan"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {planJson && (
        <pre className="mt-3 max-h-64 overflow-auto rounded border border-white/5 bg-black/40 p-3 text-xs text-slate-300">
          {planJson}
        </pre>
      )}
    </div>
  );
}
