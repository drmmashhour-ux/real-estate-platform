"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioDashboardDealRow } from "@/types/investment-deal-client";
import { GeneratedByLecipm } from "@/components/brand/GeneratedByLecipm";
import {
  getInsightToneFromString,
  getMarketComparisonToneFromString,
  getRiskScoreTone,
  insightPillClass,
} from "@/lib/investment/deal-metrics";
import { computePortfolioAnalytics, type PortfolioDealLike } from "@/lib/investment/portfolio-analytics";
import { formatCurrencyCAD, formatRoiPercent } from "@/lib/investment/format";
import { setActivationDashboardVisited } from "@/lib/investment/activation-storage";
import { useProductInsights } from "@/hooks/use-product-insights";
import { ShareDealButton } from "@/components/investment/ShareDealButton";
import { buildInviteFriendMessage, buildViralToolMessage } from "@/lib/investment/share-deal-copy";
import { useToast } from "@/components/ui/ToastProvider";
import { track, TrackingEvent } from "@/lib/tracking";
import { WasThisHelpful } from "@/components/feedback/WasThisHelpful";
import { RENTAL_TYPE, rentalTypeLabel } from "@/lib/investment/rental-model";
import { effectiveMonthlyCashFlowForDeal } from "@/lib/investment/rental-strategy-compare";
import {
  INVESTMENT_LIMIT_MESSAGE,
  type InvestmentMonetizationSnapshot,
} from "@/lib/investment/monetization";
import { UpgradeToProLink } from "@/components/investment/UpgradeToProLink";
import { MortgageUserHub } from "@/components/mortgage/MortgageUserHub";

export type DashboardDealRow = PortfolioDashboardDealRow;

const PI_DISMISS_DASH_AVG = "lecipm_pi_dismiss_dash_avg_v1";
const PI_DISMISS_DASH_COMPARE = "lecipm_pi_dismiss_dash_compare_v1";
const PI_DISMISS_BEHAVIOR_1 = "lecipm_pi_dismiss_behavior_one_deal_v1";
const PI_DISMISS_BEHAVIOR_2 = "lecipm_pi_dismiss_behavior_compare_v1";
const VIRAL_BANNER_DISMISS = "lecipm_investment_dashboard_viral_banner_v1";

function savedLabel(createdAt: Date | string): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/** Model risk from deterministic score (0–100, higher = riskier). */
function riskBandFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "—" {
  if (!Number.isFinite(score)) return "—";
  if (score < 35) return "LOW";
  if (score < 60) return "MEDIUM";
  return "HIGH";
}

function explainBestDeal(d: PortfolioDealLike): string {
  const band = riskBandFromScore(d.riskScore);
  const market = d.marketComparison;
  const marketHint =
    market === "Below Market"
      ? "Modeled pricing looks favorable versus typical asks."
      : market === "Above Market"
        ? "Even with strong headline ROI, verify comps — the ask may be stretched."
        : "Pricing sits near typical market ranges in this model.";
  return `Highest cash-on-cash in your saves. ${marketHint} Modeled risk: ${band}.`;
}

function explainWorstDeal(d: PortfolioDealLike): string {
  const band = riskBandFromScore(d.riskScore);
  const market = d.marketComparison;
  const marketHint =
    market === "Above Market"
      ? "List pricing may compress yield — test a lower price or higher rent in Analyze."
      : "Tighten rent or expense inputs to see if this save improves.";
  return `Lowest ROI in your set. ${marketHint} Modeled risk: ${band}.`;
}

function ReferralInviteBlock({ referrerUserId }: { referrerUserId?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setShareText(buildInviteFriendMessage(origin, referrerUserId ?? undefined));
  }, [referrerUserId]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [shareText]);

  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-950/25 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-white">Invite a friend to try the platform</h2>
      <p className="mt-2 text-sm text-slate-400">
        Share this message — the demo analyzer works without an account.
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-300 sm:text-sm">
        {shareText || "Loading share message…"}
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        {copied ? "Copied!" : "Copy share text"}
      </button>
    </section>
  );
}

export function PortfolioDashboardClient({
  deals,
  variant = "live",
  demoHint,
  shareReferrerUserId,
  monetization,
}: {
  deals: DashboardDealRow[];
  variant?: "live" | "demo";
  /** Show onboarding hint for first-time demo viewers */
  demoHint?: boolean;
  /** Adds ?ru= on shared deal links (live accounts) */
  shareReferrerUserId?: string | null;
  /** Free vs Pro snapshot (live dashboard only) */
  monetization?: InvestmentMonetizationSnapshot | null;
}) {
  const { showToast } = useToast();
  const analytics = useMemo(() => computePortfolioAnalytics(deals), [deals]);

  const analyzeHref = variant === "demo" ? "/analyze#analyzer" : "/analyze#analyzer";
  const dashboardCompareHref = variant === "demo" ? "/demo/compare" : "/compare";

  const { isLowAvgDealsPerUser, compareUsageLow, status: insightsStatus } = useProductInsights();
  const [dismissAvgInsight, setDismissAvgInsight] = useState(false);
  const [dismissCompareInsight, setDismissCompareInsight] = useState(false);
  const [dismissBehaviorOne, setDismissBehaviorOne] = useState(false);
  const [dismissBehaviorCompare, setDismissBehaviorCompare] = useState(false);
  const [dismissViralBanner, setDismissViralBanner] = useState(false);

  useEffect(() => {
    setActivationDashboardVisited();
  }, []);

  useEffect(() => {
    track(TrackingEvent.INVESTMENT_DASHBOARD_VISIT, {
      meta: { variant, dealCount: deals.length },
    });
  }, [variant, deals.length]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (localStorage.getItem(PI_DISMISS_DASH_AVG) === "1") setDismissAvgInsight(true);
        if (localStorage.getItem(PI_DISMISS_DASH_COMPARE) === "1") setDismissCompareInsight(true);
        if (localStorage.getItem(PI_DISMISS_BEHAVIOR_1) === "1") setDismissBehaviorOne(true);
        if (localStorage.getItem(PI_DISMISS_BEHAVIOR_2) === "1") setDismissBehaviorCompare(true);
        if (localStorage.getItem(VIRAL_BANNER_DISMISS) === "1") setDismissViralBanner(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const showAvgInsightBanner =
    insightsStatus === "ready" && isLowAvgDealsPerUser && !dismissAvgInsight;
  const showCompareInsightBanner =
    insightsStatus === "ready" && compareUsageLow && !dismissCompareInsight;
  const showOneDealNudge = deals.length === 1 && !dismissBehaviorOne;
  const showMultiDealCompareNudge = deals.length >= 2 && !dismissBehaviorCompare;

  const copyViralMessage = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = buildViralToolMessage(origin);
    void navigator.clipboard.writeText(text).then(
      () => showToast("Message copied — share anywhere", "success"),
      () => showToast("Could not copy", "info")
    );
  }, [showToast]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      {variant === "live" && monetization?.isAtOrOverFreeLimit ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-500/45 bg-amber-950/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          role="status"
        >
          <div>
            <p className="font-semibold text-amber-100">{INVESTMENT_LIMIT_MESSAGE}</p>
            <p className="mt-1 text-sm text-slate-400">
              You’re at {monetization.savedDealCount}/{monetization.maxFreeDeals} saved deals on the Free plan. Upgrade for
              unlimited tracking and full features.
            </p>
          </div>
          <UpgradeToProLink
            source="dashboard_limit_banner"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-900/30 hover:bg-amber-400"
          />
        </div>
      ) : null}

      <MortgageUserHub isLoggedIn={variant === "live"} variant="dashboard" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Investment MVP</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Portfolio dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Portfolio analytics from your saved deals — estimates only, not financial advice. Updates automatically when you
            add deals.
          </p>
          {deals.length === 1 ? (
            <div className="mt-4">
              <WasThisHelpful context="dashboard_portfolio" />
            </div>
          ) : null}
          {variant === "live" ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              <strong className="text-slate-200">Demo hint:</strong> Track your investment portfolio here. Open{" "}
              <Link href="/compare" className="font-medium text-premium-gold hover:underline">
                Compare
              </Link>{" "}
              to review 2–4 deals side by side.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              <strong className="text-slate-200">Demo hint:</strong> Track your investment portfolio here. Open{" "}
              <Link href={dashboardCompareHref} className="font-medium text-premium-gold hover:underline">
                Compare
              </Link>{" "}
              to review 2–4 deals side by side.
            </p>
          )}
          {demoHint && variant === "demo" ? (
            <p
              className="mt-3 rounded-xl border border-premium-gold/30 bg-[#14110a]/30 px-4 py-3 text-sm text-[#d4c9a8]"
              role="status"
            >
              <span className="font-semibold text-premium-gold">Quick tip:</span> Use{" "}
              <Link href="/analyze" className="font-medium text-premium-gold underline hover:text-premium-gold">
                Analyze
              </Link>{" "}
              to add more deals, then compare them here.
            </p>
          ) : null}
          {variant === "demo" ? (
            <p className="mt-3 max-w-2xl rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/95">
              <strong className="text-amber-300">Demo mode:</strong> Data is stored in this browser only until you sign
              in. Use{" "}
              <Link href="/auth/signup" className="font-medium text-amber-200 underline hover:text-white">
                Create account
              </Link>{" "}
              to sync to your portfolio.
            </p>
          ) : null}
        </div>
        <Link
          href={analyzeHref}
          className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-black/40 transition hover:bg-premium-gold"
        >
          Analyze a deal
        </Link>
      </div>

      {variant === "live" && !dismissViralBanner ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-violet-500/35 bg-violet-950/25 px-4 py-3 text-sm text-violet-100 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="font-medium text-white">Know someone investing in real estate? Share this tool.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyViralMessage()}
              className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-400"
            >
              Copy message
            </button>
            <button
              type="button"
              className="text-xs text-violet-300/80 underline hover:text-white"
              onClick={() => {
                try {
                  localStorage.setItem(VIRAL_BANNER_DISMISS, "1");
                } catch {
                  /* ignore */
                }
                setDismissViralBanner(true);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {showAvgInsightBanner ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-sky-500/35 bg-sky-950/30 px-4 py-3 text-sm text-sky-100 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="font-medium">Add another deal to compare strategies.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={analyzeHref}
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
            >
              Analyze a deal
            </Link>
            <button
              type="button"
              className="text-xs text-sky-300/80 underline hover:text-white"
              onClick={() => {
                try {
                  localStorage.setItem(PI_DISMISS_DASH_AVG, "1");
                } catch {
                  /* ignore */
                }
                setDismissAvgInsight(true);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {showCompareInsightBanner ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-fuchsia-500/35 bg-fuchsia-950/25 px-4 py-3 text-sm text-fuchsia-100 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="font-medium">Compare your deals to find the best strategy.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={dashboardCompareHref}
              className="rounded-lg bg-fuchsia-500/90 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-fuchsia-400"
            >
              Open compare
            </Link>
            <button
              type="button"
              className="text-xs text-fuchsia-300/80 underline hover:text-white"
              onClick={() => {
                try {
                  localStorage.setItem(PI_DISMISS_DASH_COMPARE, "1");
                } catch {
                  /* ignore */
                }
                setDismissCompareInsight(true);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {showOneDealNudge ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-premium-gold/30 bg-[#14110a]/20 px-4 py-3 text-sm text-[#d4c9a8] sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p>
            <span className="font-semibold text-premium-gold">Next step:</span> add another deal to compare strategies.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={analyzeHref}
              className="rounded-lg border border-premium-gold/50 bg-premium-gold/15 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/25"
            >
              Add another deal
            </Link>
            <button
              type="button"
              className="text-xs text-premium-gold/70 underline hover:text-white"
              onClick={() => {
                try {
                  localStorage.setItem(PI_DISMISS_BEHAVIOR_1, "1");
                } catch {
                  /* ignore */
                }
                setDismissBehaviorOne(true);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {showMultiDealCompareNudge ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="font-medium text-amber-50">
            Compare your deals to find the best investment
            <span className="mt-1 block text-sm font-normal text-amber-100/85">
              See long-term vs short-term and benchmarks side by side.
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={dashboardCompareHref}
              className="rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Compare deals
            </Link>
            <button
              type="button"
              className="text-xs text-amber-300/80 underline hover:text-white"
              onClick={() => {
                try {
                  localStorage.setItem(PI_DISMISS_BEHAVIOR_2, "1");
                } catch {
                  /* ignore */
                }
                setDismissBehaviorCompare(true);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Portfolio overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              {analytics.totalDeals === 0
                ? "Save deals from the analyzer to see aggregated metrics."
                : `${analytics.totalDeals} saved ${analytics.totalDeals === 1 ? "deal" : "deals"} in your portfolio.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={analyzeHref} className="text-premium-gold hover:underline">
              New analysis
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/" className="text-slate-400 hover:text-white">
              Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6 shadow-inner shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total investment</p>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {analytics.totalDeals === 0 ? "—" : formatCurrencyCAD(analytics.totalInvestment)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Sum of property prices in saved analyses</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6 shadow-inner shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Monthly cash flow</p>
            <p
              className={`mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl ${
                analytics.totalDeals > 0 && analytics.totalMonthlyCashFlow < 0 ? "text-red-300" : "text-white"
              }`}
            >
              {analytics.totalDeals === 0 ? "—" : formatCurrencyCAD(analytics.totalMonthlyCashFlow)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Sum of (rent or est. revenue − expenses) per month</p>
          </div>
          <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-[#14110a]/50 to-slate-950 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">Average ROI</p>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-premium-gold sm:text-3xl">
              {analytics.totalDeals === 0 ? "—" : formatRoiPercent(analytics.averageROI)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Mean of saved deal ROIs</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-premium-gold/35 bg-[#14110a]/25 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Best deal</p>
            {analytics.bestDeal ? (
              <>
                <p className="mt-3 font-mono text-3xl font-bold text-premium-gold">{formatRoiPercent(analytics.bestDeal.roi)}</p>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="text-slate-500">City:</span> {analytics.bestDeal.city}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-premium-gold/90">
                  Risk {riskBandFromScore(analytics.bestDeal.riskScore)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{explainBestDeal(analytics.bestDeal)}</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">—</p>
            )}
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Worst deal</p>
            {analytics.worstDeal ? (
              <>
                <p className="mt-3 font-mono text-3xl font-bold text-amber-200">{formatRoiPercent(analytics.worstDeal.roi)}</p>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="text-slate-500">City:</span> {analytics.worstDeal.city}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-400/90">
                  Risk {riskBandFromScore(analytics.worstDeal.riskScore)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{explainWorstDeal(analytics.worstDeal)}</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">—</p>
            )}
          </div>
        </div>
      </section>

      <ReferralInviteBlock referrerUserId={variant === "live" ? shareReferrerUserId : null} />

      {deals.length >= 2 ? (
        <div className="rounded-2xl border border-premium-gold/40 bg-[#14110a]/30 px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-semibold text-white">Compare your deals to find the best investment</p>
            <p className="mt-1 text-sm text-slate-400">Side-by-side ROI, cash flow, and risk for up to four saves.</p>
          </div>
          <Link
            href={dashboardCompareHref}
            className="mt-4 inline-flex shrink-0 items-center justify-center rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-premium-gold sm:mt-0"
          >
            Open compare
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Your deals</h2>
        {deals.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No saved deals yet"
            description="Analyze a listing and save it — your deals table, compare view, and share links all build from saved opportunities."
          >
            <>
              <Link
                href={analyzeHref}
                className="rounded-xl bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] shadow-lg shadow-premium-gold/25 transition hover:bg-premium-gold"
              >
                Open Analyze
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-premium-gold/35 hover:text-white"
              >
                Browse featured listings
              </Link>
            </>
          </EmptyState>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
              <table className="w-full min-w-[1024px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Saved</th>
                    <th className="px-4 py-3">Best strategy</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Property price</th>
                    <th className="px-4 py-3">Monthly CF</th>
                    <th className="px-4 py-3">Annual CF</th>
                    <th className="px-4 py-3">ROI</th>
                    <th className="px-4 py-3">vs market</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => {
                    const monthlyCf = effectiveMonthlyCashFlowForDeal(d);
                    const annualCf = monthlyCf * 12;
                    const pref = (d.preferredStrategy ?? d.rentalType) as string;
                    const isSt = pref === RENTAL_TYPE.SHORT_TERM;
                    return (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-slate-400">{savedLabel(d.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              isSt
                                ? "bg-premium-gold/25 text-premium-gold ring-2 ring-premium-gold/50"
                                : "bg-premium-gold/20 text-[#d4c9a8] ring-2 ring-premium-gold/40"
                            }`}
                          >
                            {rentalTypeLabel(pref)}
                          </span>
                          {d.roiLongTerm != null && d.roiShortTerm != null ? (
                            <p className="mt-1 text-[10px] leading-tight text-slate-500">
                              LT {formatRoiPercent(d.roiLongTerm)} · ST {formatRoiPercent(d.roiShortTerm)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-200">{d.city}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrencyCAD(d.propertyPrice)}</td>
                        <td className="px-4 py-3">{formatCurrencyCAD(monthlyCf)}</td>
                        <td className="px-4 py-3">{formatCurrencyCAD(annualCf)}</td>
                        <td className="px-4 py-3 font-semibold text-premium-gold">{formatRoiPercent(d.roi)}</td>
                        <td className="px-4 py-3">
                          <span className={insightPillClass(getMarketComparisonToneFromString(d.marketComparison))}>
                            {d.marketComparison}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={insightPillClass(getRiskScoreTone(d.riskScore))}>{d.riskScore}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={insightPillClass(getInsightToneFromString(d.rating))}>{d.rating}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ShareDealButton
                            dealId={d.id}
                            referrerUserId={variant === "live" ? shareReferrerUserId : undefined}
                            shareVariant={variant === "demo" ? "demo" : "live"}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="space-y-4 md:hidden">
              {deals.map((d) => {
                const monthlyCf = effectiveMonthlyCashFlowForDeal(d);
                const annualCf = monthlyCf * 12;
                const pref = (d.preferredStrategy ?? d.rentalType) as string;
                const isSt = pref === RENTAL_TYPE.SHORT_TERM;
                return (
                  <li key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-500">{savedLabel(d.createdAt)}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-sky-300">
                      <span>{d.city}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isSt ? "bg-premium-gold/30 text-premium-gold ring-1 ring-premium-gold/50" : "bg-premium-gold/30 text-[#d4c9a8] ring-1 ring-premium-gold/40"
                        }`}
                      >
                        Best: {rentalTypeLabel(pref)}
                      </span>
                    </p>
                    {d.roiLongTerm != null && d.roiShortTerm != null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        LT {formatRoiPercent(d.roiLongTerm)} · ST {formatRoiPercent(d.roiShortTerm)}
                      </p>
                    ) : null}
                    {d.nightlyRate != null && d.occupancyRate != null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        ST inputs: {formatCurrencyCAD(d.nightlyRate)}/night · {d.occupancyRate.toFixed(0)}% occ.
                      </p>
                    ) : null}
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrencyCAD(d.propertyPrice)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-slate-500">Monthly CF</dt>
                        <dd className="font-mono">{formatCurrencyCAD(monthlyCf)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Annual CF</dt>
                        <dd className="font-mono">{formatCurrencyCAD(annualCf)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-500">ROI</dt>
                        <dd className="font-mono text-lg font-semibold text-premium-gold">{formatRoiPercent(d.roi)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-500">vs market</dt>
                        <dd>
                          <span className={insightPillClass(getMarketComparisonToneFromString(d.marketComparison))}>
                            {d.marketComparison}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Risk score</dt>
                        <dd>
                          <span className={insightPillClass(getRiskScoreTone(d.riskScore))}>{d.riskScore}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Rating</dt>
                        <dd>
                          <span className={insightPillClass(getInsightToneFromString(d.rating))}>{d.rating}</span>
                        </dd>
                      </div>
                      <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2">
                        <ShareDealButton
                          dealId={d.id}
                          referrerUserId={variant === "live" ? shareReferrerUserId : undefined}
                          shareVariant={variant === "demo" ? "demo" : "live"}
                          size="sm"
                        />
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <GeneratedByLecipm className="border-t border-white/10 pt-10" />
    </div>
  );
}
