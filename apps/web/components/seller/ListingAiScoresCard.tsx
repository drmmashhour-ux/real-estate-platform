"use client";

import { useState } from "react";
import type { ListingAiScoresResult } from "@/lib/fsbo/listing-ai-scores";

function riskLabel(score: number): { label: string; color: string; bar: string } {
  if (score >= 70) return { label: "Higher risk", color: "text-red-300", bar: "bg-red-500" };
  if (score >= 40) return { label: "Medium risk", color: "text-amber-200", bar: "bg-amber-400" };
  return { label: "Lower risk", color: "text-emerald-300", bar: "bg-emerald-500" };
}

function trustLabel(score: number): { label: string; color: string; bar: string } {
  if (score >= 70) return { label: "High trust", color: "text-emerald-300", bar: "bg-emerald-500" };
  if (score >= 40) return { label: "Medium trust", color: "text-amber-200", bar: "bg-amber-400" };
  return { label: "Build trust", color: "text-red-300", bar: "bg-red-500" };
}

export function ListingAiScoresCard({
  scores,
  compact = false,
}: {
  scores: ListingAiScoresResult | null;
  /** When true, slightly tighter padding for dashboard */
  compact?: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);

  if (!scores) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-xs text-slate-500">
        Risk and trust scores appear after you save your declaration or upload documents.
      </div>
    );
  }

  const r = riskLabel(scores.riskScore);
  const t = trustLabel(scores.trustScore);

  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#141414] ${compact ? "px-3 py-3" : "px-4 py-4"} text-sm text-slate-200`}
    >
      <p className="text-xs font-medium text-slate-400">Transparency scores</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        These scores help you see gaps — they are informational and do not block your listing.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Risk score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-white">{scores.riskScore}</span>
            <span className="text-slate-500">/ 100</span>
            <span className={`text-xs font-medium ${r.color}`}>
              ⚠️ {r.label}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full ${r.bar} transition-all`} style={{ width: `${scores.riskScore}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-slate-600">Higher = more topics to review carefully</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Trust score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-white">{scores.trustScore}</span>
            <span className="text-slate-500">/ 100</span>
            <span className={`text-xs font-medium ${t.color}`}>
              ✅ {t.label}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full ${t.bar} transition-all`} style={{ width: `${scores.trustScore}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-slate-600">Higher = stronger documentation &amp; clarity</p>
        </div>
      </div>

      {scores.reasons.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setWhyOpen((o) => !o)}
            className="text-xs font-medium text-premium-gold hover:underline"
          >
            Why this score? {whyOpen ? "▲" : "▼"}
          </button>
          {whyOpen ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
              {scores.reasons.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
