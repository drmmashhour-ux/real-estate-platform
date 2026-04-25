"use client";

type L = "not_ready" | "discussion_ready" | "offer_ready" | "high_offer_intent";

const LBL: Record<L, string> = {
  not_ready: "Not ready for offer talk",
  discussion_ready: "Discussion may be possible",
  offer_ready: "Offer discussion may fit (heuristic)",
  high_offer_intent: "Strong offer intent signal (heuristic)",
};

export function OfferReadinessMeter({ score, label }: { score: number; label: L }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Offer readiness</span>
        <span className="font-mono text-slate-200">{Math.round(score)}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-amber-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <p className="text-xs text-slate-300">{LBL[label]}</p>
    </div>
  );
}
