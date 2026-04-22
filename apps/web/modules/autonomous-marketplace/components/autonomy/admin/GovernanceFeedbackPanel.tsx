"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type {
  GovernanceFeedbackAdminDashboardSummary,
  GovernanceFeedbackInvestorDashboardSummary,
} from "@/modules/autonomous-marketplace/dashboard/governance-feedback-dashboard.service";
import type {
  GovernancePerformanceSummary,
  GovernanceThresholdRecommendation,
} from "@/modules/autonomous-marketplace/feedback/governance-feedback.types";

function governanceFeedbackPanelCopy() {
  return {
    title: "Outcome feedback intelligence",
    subtitle: "Advisory metrics — deterministic governance remains authoritative.",
    fp: "False positive rate",
    fn: "False negative rate",
    protected: "Protected revenue (est.)",
    leaked: "Leaked revenue (est.)",
    narrativeLead: "System prevented",
    narrativeAnd: "and leaked",
    goodBlockVsBad: "Good block vs bad block",
    goodBlocks: "Good blocks",
    badBlocks: "Bad blocks",
    missedRisk: "Missed risk",
    approvalQuality: "Approval quality",
    goodApprovals: "Good approvals",
    badApprovals: "Bad approvals",
    recommendations: "Threshold suggestions (review only)",
    investor: "Investor narrative",
    empty: "No feedback cases recorded yet. Outcome labels appear as controlled runs complete.",
    loading: "Loading governance feedback…",
    errorGeneric: "Could not load governance feedback.",
    posture: "Quality posture",
    noRecommendations: "No threshold adjustments suggested for the current window.",
    disabledOrForbidden: "Autonomous marketplace feedback is unavailable (feature off or insufficient access).",
  } as const;
}

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

type ApiSuccessBody = {
  ok: true;
  performanceSummary: GovernancePerformanceSummary;
  thresholdRecommendations: GovernanceThresholdRecommendation[];
  adminSummary: GovernanceFeedbackAdminDashboardSummary;
  investorSummary: GovernanceFeedbackInvestorDashboardSummary;
};

export type GovernanceFeedbackPanelProps = {
  /** Passed as `?limit=` to the API (default 500). */
  limit?: number;
};

function LoadingSkeleton() {
  const copy = governanceFeedbackPanelCopy();
  return (
    <div className="flex flex-col gap-3 text-sm text-white/90" aria-busy="true" aria-label={copy.loading}>
      <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-10 w-full max-w-xl animate-pulse rounded bg-white/10" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="!p-3">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-white/15" />
          </Card>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="!p-3">
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-8 w-full animate-pulse rounded bg-white/10" />
          </Card>
        ))}
      </div>
      <Card className="!p-3">
        <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
        </div>
      </Card>
    </div>
  );
}

export function GovernanceFeedbackPanel({ limit = 500 }: GovernanceFeedbackPanelProps) {
  const copy = governanceFeedbackPanelCopy();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState<ApiSuccessBody | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("limit", String(limit));
      const res = await fetch(`/api/admin/autonomy/governance-feedback?${q.toString()}`, {
        credentials: "same-origin",
      });
      const json = (await res.json()) as ApiSuccessBody | { ok?: boolean; error?: string };
      if (!res.ok || json.ok !== true || !("performanceSummary" in json)) {
        const msg =
          typeof json === "object" && json && "error" in json && typeof json.error === "string"
            ? json.error
            : copy.errorGeneric;
        if (res.status === 403) setError(copy.disabledOrForbidden);
        else setError(msg);
        setBody(null);
        return;
      }
      setBody(json);
    } catch {
      setError(copy.errorGeneric);
      setBody(null);
    } finally {
      setLoading(false);
    }
  }, [copy.disabledOrForbidden, copy.errorGeneric, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const adminSummary = body?.adminSummary ?? null;
  const totalCases = body?.performanceSummary.totalCases ?? 0;
  const protectedEst = adminSummary?.protectedRevenueEstimate ?? 0;
  const leakedEst = adminSummary?.leakedRevenueEstimate ?? 0;

  const badge = useMemo(() => {
    const p = adminSummary?.governanceQualityPosture;
    if (p === "strong") return "bg-emerald-500/15 text-emerald-200";
    if (p === "mixed") return "bg-amber-500/15 text-amber-100";
    if (p === "needs_attention") return "bg-red-500/15 text-red-200";
    return "bg-white/10 text-white/70";
  }, [adminSummary?.governanceQualityPosture]);

  const goodApprovals = adminSummary?.goodApprovals ?? 0;
  const badApprovals = adminSummary?.badApprovals ?? 0;
  const approvalDen = goodApprovals + badApprovals;
  const approvalQualityRate = approvalDen > 0 ? (goodApprovals / approvalDen) * 100 : null;

  const goodBlocks = adminSummary?.goodBlocks ?? 0;
  const badBlocks = adminSummary?.badBlocks ?? 0;
  const blockDen = goodBlocks + badBlocks;
  const goodBlockShare = blockDen > 0 ? (goodBlocks / blockDen) * 100 : null;

  if (loading) {
    return (
      <Card className="!p-4">
        <div className="mb-3 text-sm font-semibold text-white">{copy.title}</div>
        <LoadingSkeleton />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!p-4">
        <div className="text-sm font-semibold text-white">{copy.title}</div>
        <p className="mt-2 text-xs text-red-300">{error}</p>
      </Card>
    );
  }

  if (!adminSummary || totalCases === 0) {
    return (
      <Card className="!p-4">
        <div className="text-sm font-semibold text-white">{copy.title}</div>
        <p className="mt-2 text-xs text-white/60">{copy.empty}</p>
      </Card>
    );
  }

  const recs = body?.thresholdRecommendations ?? [];

  return (
    <div className="flex flex-col gap-3 text-sm text-white/90">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{copy.title}</h3>
          <p className="text-xs text-white/55">{copy.subtitle}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          {copy.posture}: {adminSummary.governanceQualityPosture}
        </span>
      </div>

      <Card className="!border-premium-gold/25 !bg-white/[0.04] !p-3">
        <p className="text-sm font-medium leading-snug text-white">
          {copy.narrativeLead}{" "}
          <span className="text-emerald-200/95">{money.format(protectedEst)}</span> {copy.narrativeAnd}{" "}
          <span className="text-amber-200/95">{money.format(leakedEst)}</span>
          <span className="text-xs font-normal text-white/50"> (estimates)</span>
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.fp}</div>
          <div className="mt-1 font-semibold">{pct(adminSummary.falsePositiveRate)}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.fn}</div>
          <div className="mt-1 font-semibold">{pct(adminSummary.falseNegativeRate)}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.protected}</div>
          <div className="mt-1 font-semibold">{money.format(protectedEst)}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.leaked}</div>
          <div className="mt-1 font-semibold">{money.format(leakedEst)}</div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="!p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">{copy.goodBlockVsBad}</div>
          <div className="mt-3 flex gap-4">
            <div>
              <div className="text-[10px] uppercase text-white/45">{copy.goodBlocks}</div>
              <div className="text-xl font-semibold text-emerald-200/95">{adminSummary.goodBlocks}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/45">{copy.badBlocks}</div>
              <div className="text-xl font-semibold text-rose-200/95">{adminSummary.badBlocks}</div>
            </div>
          </div>
          {goodBlockShare !== null ? (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-white/45">
                <span>Good-block share</span>
                <span>{goodBlockShare.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${Math.min(100, Math.max(0, goodBlockShare))}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-white/45">No block outcomes in window.</p>
          )}
        </Card>

        <Card className="!p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">{copy.missedRisk}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{adminSummary.missedRiskCases}</div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/55">
            Cases labeled MISSED_RISK after downstream truth (chargebacks, disputes, execution failures, etc.).
          </p>
        </Card>

        <Card className="!p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">{copy.approvalQuality}</div>
          <div className="mt-3 flex gap-4">
            <div>
              <div className="text-[10px] uppercase text-white/45">{copy.goodApprovals}</div>
              <div className="text-xl font-semibold text-emerald-200/95">{adminSummary.goodApprovals}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/45">{copy.badApprovals}</div>
              <div className="text-xl font-semibold text-rose-200/95">{adminSummary.badApprovals}</div>
            </div>
          </div>
          {approvalQualityRate !== null ? (
            <p className="mt-3 text-[11px] text-white/70">
              Clean approval rate:{" "}
              <span className="font-semibold text-white">{approvalQualityRate.toFixed(1)}%</span>
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-white/45">No approval outcomes in window.</p>
          )}
        </Card>
      </div>

      <Card className="!p-3">
        <div className="text-xs uppercase tracking-wide text-white/50">{copy.recommendations}</div>
        {recs.length === 0 ? (
          <p className="mt-2 text-xs text-white/55">{copy.noRecommendations}</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-white/80">
            {recs.slice(0, 8).map((r) => (
              <li key={`${r.metricKey}-${r.direction}-${r.rationale.slice(0, 24)}`}>
                <span className="font-medium text-white">{r.metricKey}</span> —{" "}
                <span className="text-white/90">{r.direction}</span>
                <span className="text-white/50"> ({r.confidence})</span>: {r.rationale}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {body?.investorSummary ? (
        <Card className="!p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">{copy.investor}</div>
          <p className="mt-2 text-xs leading-relaxed text-white/75">{body.investorSummary.narrativeSummary}</p>
          <p className="mt-2 text-xs text-white/60">{body.investorSummary.aiProtectionEffectiveness}</p>
        </Card>
      ) : null}
    </div>
  );
}
