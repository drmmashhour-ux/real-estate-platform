"use client";

import { useState } from "react";
import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";

type Props = {
  listing: Record<string, unknown>;
};

export function LegalReadinessPanel({ listing }: Props) {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [fixes, setFixes] = useState<string[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/legal/ai/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(listing),
      });
      const j = (await res.json()) as {
        legalReadinessScore?: number;
        score?: number;
        flags?: string[];
        recommendedFixes?: string[];
        narrative?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Check failed");
        return;
      }
      setScore(j.legalReadinessScore ?? j.score ?? null);
      setFlags(Array.isArray(j.flags) ? j.flags : []);
      setFixes(Array.isArray(j.recommendedFixes) ? j.recommendedFixes : []);
      setNarrative(typeof j.narrative === "string" ? j.narrative : null);
    } catch {
      setErr("Could not run legal readiness check.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Legal readiness (AI-assisted)</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Flags missing disclosures, thin copy, or weak visuals — not a legal review.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runCheck()}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Run legal readiness"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-400">{err}</p> : null}
      {score != null ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">Legal readiness score</span>
            <span className="text-2xl font-bold text-emerald-400">{score}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          {flags.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-amber-200/90">Flags</p>
              <ul className="mt-1 list-inside list-disc text-xs text-slate-300">
                {flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {fixes.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-sky-200/90">Recommended fixes</p>
              <ul className="mt-1 list-inside list-disc text-xs text-slate-300">
                {fixes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {narrative ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{narrative}</p>
          ) : null}
          <LegalAiDisclaimer />
        </div>
      ) : null}
    </div>
  );
}
