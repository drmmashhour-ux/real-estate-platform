"use client";

import type { AiRiskFinding } from "@/modules/ai-drafting-correction/types";

type Props = {
  findings: AiRiskFinding[];
  turboDraftStatus?: string;
  loading?: boolean;
};

function severityStyle(s: string): string {
  if (s === "CRITICAL") return "border-red-500/50 bg-red-500/10 text-red-100";
  if (s === "WARNING") return "border-amber-500/40 bg-amber-500/10 text-amber-50";
  return "border-white/15 bg-white/[0.04] text-slate-200";
}

export function AiRiskReviewPanel({ findings, turboDraftStatus, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-premium-gold/20 bg-[#0B0B0B]/90 p-4 text-sm text-slate-400" role="status">
        Analyse des risques en cours…
      </div>
    );
  }

  const blocking = findings.filter((f) => f.blocking || f.severity === "CRITICAL");
  const rest = findings.filter((f) => !f.blocking && f.severity !== "CRITICAL");

  return (
    <div className="space-y-4 rounded-xl border border-premium-gold/25 bg-gradient-to-b from-[#0B0B0B] to-black/95 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-premium-gold">Revue IA &amp; règles déterministes</h3>
        {turboDraftStatus ? (
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-300">
            Statut: {turboDraftStatus}
          </span>
        ) : null}
      </div>

      {blocking.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Points bloquants / critiques</p>
          <ul className="space-y-2">
            {blocking.map((f) => (
              <li
                key={`${f.findingKey}-${f.sectionKey ?? ""}`}
                className={`rounded-lg border p-3 text-sm ${severityStyle(f.severity)}`}
              >
                <p className="font-medium">{f.findingKey}</p>
                <p className="mt-1">{f.messageFr}</p>
                {f.suggestedFixFr ? <p className="mt-2 text-xs opacity-90">→ {f.suggestedFixFr}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Autres observations</p>
          <ul className="space-y-2">
            {rest.map((f) => (
              <li
                key={`${f.findingKey}-${f.sectionKey ?? "x"}-rest`}
                className={`rounded-lg border p-3 text-sm ${severityStyle(f.severity)}`}
              >
                <p className="font-medium">{f.findingKey}</p>
                <p className="mt-1">{f.messageFr}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {findings.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun risque détecté par les règles actuelles.</p>
      ) : null}
    </div>
  );
}
