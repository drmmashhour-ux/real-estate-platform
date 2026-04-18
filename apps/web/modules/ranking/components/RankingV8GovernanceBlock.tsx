"use client";

import { RANKING_V8_VALIDATION_MAX_PER_CATEGORY } from "../ranking-v8-validation-scoring.constants";
import { useRankingV8Governance } from "../useRankingV8Governance";
import type { RankingV8GovernancePayload, RankingV8GovernanceRecommendation } from "../ranking-v8-governance.types";

const REC_BADGE: Record<
  RankingV8GovernanceRecommendation,
  { label: string; className: string }
> = {
  stay_in_shadow: { label: "Stay in shadow", className: "bg-slate-700 text-slate-100" },
  phase_c_only: { label: "Phase C only", className: "bg-amber-900/80 text-amber-100" },
  expand_phase_c: { label: "Expand Phase C", className: "bg-emerald-900/80 text-emerald-100" },
  candidate_for_primary: { label: "Candidate for primary", className: "bg-cyan-900/80 text-cyan-100" },
  rollback_recommended: { label: "Rollback recommended", className: "bg-rose-900/90 text-rose-50" },
};

function fmtRatio(x: number | null | undefined, suffix = ""): string {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(1)}${suffix}`;
}

function fmtNum(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  return x.toFixed(2);
}

function CategoryBar({
  label,
  score,
  hint,
}: {
  label: string;
  score: number;
  hint: string;
}) {
  const pct = Math.min(100, Math.max(0, (score / RANKING_V8_VALIDATION_MAX_PER_CATEGORY) * 100));
  return (
    <div className="group relative">
      <div className="mb-0.5 flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span>
          {score.toFixed(1)}/{RANKING_V8_VALIDATION_MAX_PER_CATEGORY}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-slate-800">
        <div
          className="h-full rounded bg-emerald-600/90 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden max-w-xs rounded border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-300 shadow group-hover:block">
        {hint}
      </p>
    </div>
  );
}

function GateRow({ label, ok, na }: { label: string; ok: boolean; na?: boolean }) {
  if (na) {
    return (
      <li className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-slate-500">N/A</span>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-300">{label}</span>
      <span className={ok ? "text-emerald-400" : "text-rose-400"}>{ok ? "Ready" : "Not ready"}</span>
    </li>
  );
}

function RollbackBadges({ r }: { r: RankingV8GovernancePayload["rollbackSignals"] }) {
  const items: { key: string; label: string; on: boolean }[] = [
    { key: "severe", label: "Severe overlap drop", on: r.severeOverlapDrop },
    { key: "instab", label: "Instability spike", on: r.instabilitySpike },
    { key: "err", label: "Errors present", on: r.errorPresent },
    { key: "neg", label: "Negative user impact", on: r.negativeUserImpact },
  ];
  const any = items.some((i) => i.on);
  if (!any) {
    return <p className="text-xs text-slate-500">No rollback signals raised.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items
        .filter((i) => i.on)
        .map((i) => (
          <span
            key={i.key}
            className="rounded border border-rose-800/80 bg-rose-950/50 px-2 py-0.5 text-[10px] font-medium text-rose-100"
          >
            {i.label}
          </span>
        ))}
    </div>
  );
}

function CoverageChip({ label, value }: { label: string; value: boolean | null }) {
  const on = value === true;
  const off = value === false;
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] ${
        on ? "bg-emerald-950/60 text-emerald-200" : off ? "bg-slate-800 text-slate-500" : "bg-slate-800/80 text-slate-500"
      }`}
      title={value == null ? "Unknown / not inferred" : on ? "On" : "Off"}
    >
      {label}
      {value == null ? " · ?" : on ? " · on" : " · off"}
    </span>
  );
}

export function RankingV8GovernanceBlock() {
  const { data, loading, error, refetch } = useRankingV8Governance();

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-sm text-slate-400">Loading Ranking V8 governance…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Ranking V8 Governance</h2>
        <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-sm text-slate-500">No governance data.</p>
      </section>
    );
  }

  const rec = REC_BADGE[data.rollout.recommendation];
  const sc = data.scorecard;
  const rd = data.rollout.readiness;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Ranking V8 Governance</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Read-only advisory — does not change ranking or flags. Phase:{" "}
            <span className="text-slate-400">{data.rollout.currentPhase ?? "—"}</span>
            {data.meta.dataFreshnessMs != null ? (
              <>
                {" "}
                · Freshness ~{Math.round(data.meta.dataFreshnessMs / 1000)}s
              </>
            ) : null}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${rec.className}`}>
          {rec.label}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scorecard</h3>
          <p className="mt-1 text-2xl font-semibold text-white">
            {sc.totalScore.toFixed(1)}
            <span className="text-base font-normal text-slate-500">/{sc.maxScore}</span>
          </p>
          <div className="mt-3 space-y-2">
            <CategoryBar
              label="Quality"
              score={sc.categoryScores.quality}
              hint="Gate-oriented: overlap & rank shift vs shadow (see validation scoring docs)."
            />
            <CategoryBar
              label="Stability"
              score={sc.categoryScores.stability}
              hint="Churn, repeat consistency, large jumps when available."
            />
            <CategoryBar
              label="User impact"
              score={sc.categoryScores.userImpact}
              hint="CTR/save/lead deltas when wired; otherwise may score as unavailable."
            />
            <CategoryBar
              label="Safety"
              score={sc.categoryScores.safety}
              hint="Malformed rows, errors, skip rates when available."
            />
            <CategoryBar
              label="Coverage"
              score={sc.categoryScores.coverage}
              hint="Traffic/inventory/geo/price diversity signals when present."
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness gates</h3>
          <ul className="mt-2 space-y-1 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
            <GateRow label="Quality" ok={rd.qualityReady} />
            <GateRow label="Stability" ok={rd.stabilityReady} />
            <GateRow label="Safety" ok={rd.safetyReady} />
            <GateRow label="Coverage" ok={rd.coverageReady} />
            <GateRow
              label="User impact"
              ok={rd.userImpactReady}
              na={rd.userImpactNa}
            />
          </ul>
          {data.rollout.targetPhase ? (
            <p className="mt-2 text-[11px] text-slate-500">
              Advisory target phase: <span className="text-slate-400">{data.rollout.targetPhase}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key metrics</h3>
        <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Top-5 overlap</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.top5Overlap)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Top-10 overlap</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.top10Overlap)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Avg rank shift</dt>
            <dd className="font-mono text-slate-200">{fmtNum(data.metrics.avgRankShift)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Top-5 churn</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.top5ChurnRate)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Repeat consistency</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.repeatConsistency)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Large jump rate</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.largeJumpRate)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">CTR Δ</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.ctrDelta)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Save Δ</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.saveDelta)}</dd>
          </div>
          <div className="flex justify-between gap-2 rounded border border-slate-800/80 bg-slate-950/30 px-2 py-1.5">
            <dt className="text-slate-500">Lead Δ</dt>
            <dd className="font-mono text-slate-200">{fmtRatio(data.metrics.leadDelta)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocking reasons</h3>
          {data.rollout.blockingReasons.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">None listed.</p>
          ) : (
            <ul className="mt-1 list-inside list-disc text-xs text-amber-100/90">
              {data.rollout.blockingReasons.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollback signals</h3>
          <div className="mt-2">
            <RollbackBadges r={data.rollbackSignals} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Warnings</h3>
        {data.rollout.warnings.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">None.</p>
        ) : (
          <ul className="mt-1 max-h-28 overflow-y-auto text-xs text-slate-400">
            {data.rollout.warnings.map((w) => (
              <li key={w} className="border-b border-slate-800/60 py-0.5">
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coverage (inferred)</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <CoverageChip label="High traffic" value={data.coverage.highTraffic} />
          <CoverageChip label="Low traffic" value={data.coverage.lowTraffic} />
          <CoverageChip label="Dense inventory" value={data.coverage.denseInventory} />
          <CoverageChip label="Sparse inventory" value={data.coverage.sparseInventory} />
          <CoverageChip label="Geo diversity" value={data.coverage.geoDiversity} />
          <CoverageChip label="Price diversity" value={data.coverage.priceDiversity} />
        </div>
      </div>

      {data.history.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent snapshots</h3>
          <table className="mt-2 w-full min-w-[420px] border-collapse text-left text-[11px] text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-1 pr-2 font-medium">Time</th>
                <th className="py-1 pr-2 font-medium">Score</th>
                <th className="py-1 pr-2 font-medium">Decision</th>
                <th className="py-1 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h, i) => (
                <tr key={`${h.ts}-${i}`} className="border-b border-slate-800/60">
                  <td className="py-1 pr-2 font-mono text-slate-400">{new Date(h.ts).toLocaleString()}</td>
                  <td className="py-1 pr-2">{h.totalScore.toFixed(1)}</td>
                  <td className="py-1 pr-2">{h.decision}</td>
                  <td className="py-1">{REC_BADGE[h.recommendation].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data.meta.missingSources.length > 0 ? (
        <p className="mt-4 text-[10px] text-slate-600">
          Partial data: {data.meta.missingSources.length} source note(s).{" "}
          <button
            type="button"
            className="text-slate-500 underline hover:text-slate-400"
            onClick={() => void refetch()}
          >
            Refresh
          </button>
        </p>
      ) : null}
    </section>
  );
}
