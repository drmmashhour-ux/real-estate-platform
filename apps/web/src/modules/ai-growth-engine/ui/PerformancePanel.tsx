"use client";

import { useMemo, useState } from "react";
import { optimizeContentStrategy } from "@/src/modules/ai-growth-engine/application/optimizeContentStrategy";
import type { PerformanceMetrics } from "@/src/modules/ai-growth-engine/domain/growth.types";

export function PerformancePanel() {
  const [itemId, setItemId] = useState("");
  const [views, setViews] = useState("0");
  const [clicks, setClicks] = useState("0");
  const [conversions, setConversions] = useState("0");
  const [engagement, setEngagement] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoHints = useMemo(() => {
    const recent = [
      { topic: "Listings 101", metrics: sampleMetrics(1200, 40, 2, 1.2) },
      { topic: "Deposit basics", metrics: sampleMetrics(800, 12, 0, 0.8) },
    ];
    return optimizeContentStrategy({ recent });
  }, []);

  async function submit() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ai-growth/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          views: Number(views),
          clicks: Number(clicks),
          conversions: Number(conversions),
          engagement: Number(engagement),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Failed");
        return;
      }
      setMsg("Snapshot saved");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-sm font-semibold text-white">Performance ingest (manual)</h2>
        <p className="mt-1 text-xs text-slate-500">Connect platform analytics later — this stores daily snapshots.</p>
        <div className="mt-3 space-y-2">
          <input
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="Content item id"
            className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input value={views} onChange={(e) => setViews(e.target.value)} placeholder="views" className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
            <input value={clicks} onChange={(e) => setClicks(e.target.value)} placeholder="clicks" className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
            <input value={conversions} onChange={(e) => setConversions(e.target.value)} placeholder="conversions" className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
            <input value={engagement} onChange={(e) => setEngagement(e.target.value)} placeholder="engagement" className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
          </div>
          <button
            type="button"
            disabled={loading || !itemId}
            onClick={() => void submit()}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
          >
            Save snapshot
          </button>
          {msg ? <p className="text-xs text-slate-400">{msg}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-sm font-semibold text-white">Optimization hints (demo)</h2>
        <p className="mt-1 text-xs text-slate-500">Heuristic from sample metrics — swap with real data from API.</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
          <li>Emphasize: {demoHints.emphasizeTopics.join(", ")}</li>
          <li>Deprioritize: {demoHints.avoidTopics.join(", ") || "—"}</li>
          <li>Formats: {demoHints.preferredFormats.join(", ")}</li>
        </ul>
        <p className="mt-2 text-[11px] text-slate-500">{demoHints.rationale}</p>
      </section>
    </div>
  );
}

function sampleMetrics(views: number, clicks: number, conversions: number, engagement: number): PerformanceMetrics {
  return { views, clicks, conversions, engagement };
}
