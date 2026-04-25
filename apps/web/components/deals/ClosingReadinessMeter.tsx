"use client";

type Label = "not_ready" | "warming_up" | "close_ready" | "high_intent";

const LABEL: Record<Label, string> = {
  not_ready: "Not ready",
  warming_up: "Warming up",
  close_ready: "Close-ready (heuristic)",
  high_intent: "High intent (heuristic)",
};

export function ClosingReadinessMeter({
  score,
  label,
}: {
  score: number;
  label: Label;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Closing readiness</span>
        <span className="font-mono text-slate-200">{Math.round(score)}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <p className="text-xs text-slate-300">{LABEL[label] ?? label}</p>
    </div>
  );
}
