"use client";

import Link from "next/link";
import type { LegalHubSummary } from "@/modules/legal/legal.types";

type Props = {
  score?: LegalHubSummary["readinessScore"] | null;
  locale: string;
  country: string;
  criticalRiskCount?: number;
};

const LEVEL_LABEL: Record<string, string> = {
  not_ready: "Not ready",
  partial: "Partial",
  mostly_ready: "Mostly ready",
  ready: "Ready",
};

export function LegalReadinessScoreCard({ score, locale, country, criticalRiskCount }: Props) {
  if (!score) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-[#9CA3AF]">
        Readiness score is unavailable for this session (enable FEATURE_LEGAL_READINESS_V1 or complete Legal Hub setup).
      </div>
    );
  }

  const hubHref = `/${locale}/${country}/legal`;

  return (
    <section className="rounded-xl border border-premium-gold/25 bg-[#121212] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Legal readiness</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">{score.score}</p>
          <p className="mt-1 text-sm text-[#D1D5DB]">{LEVEL_LABEL[score.level] ?? score.level}</p>
        </div>
        <div className="text-right text-[11px] text-[#9CA3AF]">
          <p>
            Checklist {score.completed}/{score.total}
          </p>
          <p>
            Gaps — critical path: {score.missingCritical} · optional: {score.missingOptional}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
        This score reflects platform workflow completion and surfaced signals only — not legal advice. It will not show
        &quot;ready&quot; while critical compliance signals remain open.
      </p>
      {(criticalRiskCount ?? 0) > 0 ? (
        <p className="mt-2 text-xs font-medium text-amber-200/95">
          {criticalRiskCount} critical attention item(s) — review the risks section below.
        </p>
      ) : null}
      <Link href={hubHref} className="mt-3 inline-block text-xs font-semibold text-premium-gold hover:underline">
        Open Legal Hub →
      </Link>
    </section>
  );
}
