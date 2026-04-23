import React from "react";

type Pattern = {
  id: string;
  patternKey: string;
  domain: string;
  timesUsed: number;
  score: number;
  positiveCount: number;
  negativeCount: number;
};

export function CeoStrategyMemoryPanel({ 
  topPatterns, 
  riskyPatterns 
}: { 
  topPatterns: Pattern[], 
  riskyPatterns: Pattern[] 
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5">
        <h3 className="text-sm font-semibold text-emerald-100">Successful Strategies</h3>
        <div className="mt-3 space-y-3">
          {topPatterns.map(p => (
            <div key={p.id} className="text-xs border-b border-white/5 pb-2 last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-200">{p.domain} Strategy</span>
                <span className="text-emerald-400 font-mono">+{p.score.toFixed(1)}</span>
              </div>
              <p className="text-slate-500 mt-0.5">Used {p.timesUsed}x · {p.positiveCount} successes</p>
            </div>
          ))}
          {topPatterns.length === 0 && <p className="text-xs text-slate-500 italic">No patterns learned yet.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-5">
        <h3 className="text-sm font-semibold text-rose-100">Underperforming Strategies</h3>
        <div className="mt-3 space-y-3">
          {riskyPatterns.map(p => (
            <div key={p.id} className="text-xs border-b border-white/5 pb-2 last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-200">{p.domain} Strategy</span>
                <span className="text-rose-400 font-mono">{p.score.toFixed(1)}</span>
              </div>
              <p className="text-slate-500 mt-0.5">Used {p.timesUsed}x · {p.negativeCount} failures</p>
            </div>
          ))}
          {riskyPatterns.length === 0 && <p className="text-xs text-slate-500 italic">No negative patterns identified.</p>}
        </div>
      </section>
    </div>
  );
}
