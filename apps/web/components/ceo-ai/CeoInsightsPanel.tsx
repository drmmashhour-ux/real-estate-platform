import React from "react";
import { AlertCircle, Info, Zap, TrendingUp, Shield } from "lucide-react";

type Insight = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  detectedAt: string;
};

const InsightIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "GROWTH": return <TrendingUp className="text-emerald-400" size={16} />;
    case "RISK": return <Shield className="text-rose-400" size={16} />;
    case "OPPORTUNITY": return <Zap className="text-amber-400" size={16} />;
    case "REVENUE": return <Info className="text-cyan-400" size={16} />;
    default: return <AlertCircle className="text-slate-400" size={16} />;
  }
};

export function CeoInsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <AlertCircle size={16} className="text-cyan-400" />
        Strategic Insights
      </h3>
      <div className="mt-4 space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="flex gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
            <div className="mt-0.5 shrink-0">
              <InsightIcon type={insight.type} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">{insight.title}</h4>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  insight.severity === 'high' ? 'text-rose-400' : 
                  insight.severity === 'medium' ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {insight.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {insight.description}
              </p>
              <div className="mt-2 text-[10px] text-slate-600 uppercase tracking-tight">
                Detected {new Date(insight.detectedAt).toLocaleTimeString()} · {insight.type}
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-xs text-slate-500 italic py-4 text-center">No active strategic insights detected.</p>
        )}
      </div>
    </section>
  );
}
