import React from "react";
import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

type Pattern = {
  id: string;
  patternKey: string;
  domain: string;
  timesUsed: number;
  score: number;
  positiveCount: number;
  negativeCount: number;
};

export function CeoPatternInsightsCard({ 
  pattern, 
  variant = "success" 
}: { 
  pattern: Pattern;
  variant?: "success" | "risky";
}) {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? TrendingUp : TrendingDown;
  
  // Extract context description from patternKey if possible
  // patternKey format: domain:fingerprint:decisionType
  const [domain, , decisionType] = pattern.patternKey.split(":");

  return (
    <div className={`rounded-xl border p-4 ${
      isSuccess 
        ? "border-emerald-500/20 bg-emerald-950/10" 
        : "border-rose-500/20 bg-rose-950/10"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            <Icon size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">
              {decisionType} in {domain}
            </h4>
            <p className="text-[10px] text-slate-500">
              Confidence score: <span className={isSuccess ? "text-emerald-400" : "text-rose-400"}>
                {isSuccess ? "+" : ""}{pattern.score.toFixed(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usage</div>
          <div className="text-xs text-slate-300">{pattern.timesUsed} runs</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-black/20 rounded-lg p-2 border border-white/5 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Success</div>
          <div className="text-sm font-bold text-emerald-400">{pattern.positiveCount}</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2 border border-white/5 text-center">
          <div className="text-[9px] text-slate-500 uppercase">Fail</div>
          <div className="text-sm font-bold text-rose-400">{pattern.negativeCount}</div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 italic">
        {isSuccess ? (
          <>
            <Lightbulb size={12} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>CEO prioritizes this pattern when similar market conditions recur.</span>
          </>
        ) : (
          <>
            <AlertTriangle size={12} className="text-rose-400 shrink-0 mt-0.5" />
            <span>CEO penalizes confidence for this strategy in this context.</span>
          </>
        )}
      </div>
    </div>
  );
}
