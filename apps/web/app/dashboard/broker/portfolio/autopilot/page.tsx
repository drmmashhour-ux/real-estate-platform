"use client";

import { useState } from "react";

export default function PortfolioAutopilotPage() {
  const [review, setReview] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function runReview() {
    setLoading(true);
    try {
      const generated = await fetch("/api/autopilot/portfolio/generate", {
        method: "POST",
        body: JSON.stringify({
          portfolioId: "demo",
          reviewType: "manual",
        }),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());

      if (generated.success) {
        setReview(generated.item);

        const listed = await fetch("/api/autopilot/portfolio/recommendations", {
          method: "POST",
          body: JSON.stringify({
            reviewId: generated.item.id,
          }),
          headers: { "Content-Type": "application/json" },
        }).then((r) => r.json());

        setRecommendations(listed.items ?? []);
      } else {
        alert("Failed to run review: " + generated.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function accept(id: string) {
    await fetch("/api/autopilot/portfolio/recommendations/accept", {
      method: "POST",
      body: JSON.stringify({ recommendationId: id }),
      headers: { "Content-Type": "application/json" },
    });
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, accepted: true } : r))
    );
  }

  async function dismiss(id: string) {
    await fetch("/api/autopilot/portfolio/recommendations/dismiss", {
      method: "POST",
      body: JSON.stringify({ recommendationId: id }),
      headers: { "Content-Type": "application/json" },
    });
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Portfolio Autopilot Advisor</h1>
          <p className="text-white/60 mt-1">
            AI-assisted portfolio rebalancing, weak asset detection, and strategic recommendations.
          </p>
        </div>
        <button
          onClick={runReview}
          disabled={loading}
          className="rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-black hover:bg-[#B8860B] transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Run Portfolio Review"}
        </button>
      </div>

      {review && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Metric title="Health" value={review.overallHealthScore} />
          <Metric title="Concentration Risk" value={review.concentrationRisk} />
          <Metric title="Cashflow Strength" value={review.cashflowStrength} />
          <Metric title="Growth Strength" value={review.growthStrength} />
          <Metric title="Risk Score" value={review.riskScore} />
        </div>
      )}

      {review?.summary && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
          <div className="text-lg font-semibold text-[#D4AF37] mb-3">AI Strategic Summary</div>
          <div className="text-white/80 leading-relaxed whitespace-pre-wrap">{review.summary}</div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {recommendations.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-[#D4AF37]">{r.title}</div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                r.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                r.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-zinc-500/20 text-zinc-400'
              }`}>
                {r.priority} Priority
              </div>
            </div>

            <div className="text-zinc-400 text-sm">{r.description}</div>
            
            {r.aiSummary && (
              <div className="bg-black/30 rounded-xl p-4 text-sm text-zinc-300 border border-white/5">
                <span className="text-[#D4AF37] font-medium block mb-1">AI Rationale:</span>
                {r.aiSummary}
              </div>
            )}

            <div className="flex gap-3 mt-auto pt-4">
              <button
                onClick={() => accept(r.id)}
                disabled={r.accepted}
                className={`flex-1 rounded-lg px-4 py-2.5 font-semibold transition-all ${
                  r.accepted 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default' 
                  : 'bg-[#D4AF37] text-black hover:bg-[#B8860B]'
                }`}
              >
                {r.accepted ? 'Accepted' : 'Accept Recommendation'}
              </button>

              <button
                onClick={() => dismiss(r.id)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-zinc-400 hover:bg-white/5 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && review && recommendations.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-white/10">
          <p className="text-zinc-500">No active recommendations. Your portfolio looks well-balanced!</p>
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 flex flex-col items-center text-center">
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{title}</div>
      <div className="text-3xl font-bold text-[#D4AF37]">{value ?? "-"}</div>
      <div className="w-12 h-1 bg-[#D4AF37]/20 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-[#D4AF37]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
