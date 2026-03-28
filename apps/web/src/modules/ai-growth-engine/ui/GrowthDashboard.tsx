"use client";

import { useCallback, useState } from "react";
import { ContentCalendar } from "@/src/modules/ai-growth-engine/ui/ContentCalendar";
import { PerformancePanel } from "@/src/modules/ai-growth-engine/ui/PerformancePanel";

export function GrowthDashboard() {
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastPlan, setLastPlan] = useState<unknown>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const runPlan = useCallback(
    async (persist: boolean) => {
      setLoading(true);
      setMessage(null);
      try {
        const planDate = new Date().toISOString().slice(0, 10);
        const res = await fetch("/api/admin/ai-growth/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planDate, focus: focus.trim() || undefined, persist }),
        });
        const j = await res.json();
        if (!res.ok) {
          setMessage(typeof j.error === "string" ? j.error : "Plan failed");
          return;
        }
        setLastPlan(j);
        setMessage(persist ? `Saved plan ${j.savedPlanId ?? ""}` : "Generated draft (not saved)");
        setRefreshKey((k) => k + 1);
      } catch {
        setMessage("Network error");
      } finally {
        setLoading(false);
      }
    },
    [focus],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-100/90">
        <p className="font-semibold text-emerald-200">Human-in-the-loop</p>
        <p className="mt-1 text-xs text-emerald-200/80">
          Generated content is drafts only. Approve items in the calendar before any publish. No outbound social posting runs until
          infrastructure webhooks are configured.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-sm font-semibold text-white">Daily content plan</h2>
        <p className="mt-1 text-xs text-slate-500">Requires OPENAI_API_KEY for model output; otherwise deterministic fallback is used.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional focus (e.g. first-time sellers)"
            className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void runPlan(false)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? "…" : "Generate (draft)"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runPlan(true)}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:bg-[#ddb84d] disabled:opacity-50"
          >
            {loading ? "…" : "Generate & save"}
          </button>
        </div>
        {message ? <p className="mt-2 text-xs text-slate-400">{message}</p> : null}
        {lastPlan ? (
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] text-slate-500">
            {JSON.stringify(lastPlan, null, 2)}
          </pre>
        ) : null}
      </section>

      <ContentCalendar refreshKey={refreshKey} />
      <PerformancePanel />
    </div>
  );
}
