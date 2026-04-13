"use client";

import Link from "next/link";
import nextDynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  compareDealToMarket,
  computeDealMetrics,
  computeInvestmentInsights,
  getInsightTone,
  getMarketComparisonTone,
  getRiskScoreTone,
  insightPillClass,
  QUEBEC_CITY_GROUPS,
  type InsightTone,
  type MarketCity,
} from "@/lib/investment/deal-metrics";
import { appendDemoDeal, ensureDemoDealsSeeded } from "@/lib/investment/demo-deals-storage";
import type { SerializableInvestmentDeal } from "@/lib/investment/investment-deal-types";
import {
  incrementMvpEngagementAction,
  markFirstAnalysisMilestoneShown,
  readActivationFlags,
  readLastDraft,
  setActivationAnalyzed,
  setActivationSaved,
  shouldShowFirstAnalysisMilestone,
  writeLastDraft,
} from "@/lib/investment/activation-storage";
import { useProductHealth } from "@/components/analytics/ProductHealthProvider";
import { useProductInsights } from "@/hooks/use-product-insights";

const ShareAnalysisIncentiveCardLazy = nextDynamic(
  () => import("@/components/investment/ShareAnalysisIncentiveCard").then((m) => m.ShareAnalysisIncentiveCard),
  { loading: () => <div className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" aria-hidden /> }
);
const ActivationProgressStepsLazy = nextDynamic(
  () => import("@/components/investment/ActivationProgressSteps").then((m) => m.ActivationProgressSteps),
  { loading: () => null }
);
const WasThisHelpfulLazy = nextDynamic(
  () => import("@/components/feedback/WasThisHelpful").then((m) => m.WasThisHelpful),
  { loading: () => null }
);
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrencyCAD, formatRoiPercent } from "@/lib/investment/format";
import { track, TrackingEvent } from "@/lib/tracking";
import { compareRentalStrategies, type DualStrategyComparison } from "@/lib/investment/rental-strategy-compare";
import {
  INVESTMENT_LIMIT_MESSAGE,
  type InvestmentMonetizationSnapshot,
  PRO_VALUE_LINES,
} from "@/lib/investment/monetization";
import { occupancySensitivityDelta, RENTAL_TYPE } from "@/lib/investment/rental-model";
import { UpgradeToProLink } from "@/components/investment/UpgradeToProLink";
import { AiInvestmentInsightCard } from "@/components/investment/AiInsightCard";
import { AnalyzeMortgageCalculatorCard } from "@/components/mortgage/AnalyzeMortgageCalculatorCard";
import { MortgageUserHub } from "@/components/mortgage/MortgageUserHub";
import { buildRuleBasedInvestmentInsight } from "@/lib/ai/investment-insight-narrative";
import { approximateMonthlyMortgagePayment } from "@/lib/investment/approx-mortgage";

type FieldKey = "propertyPrice" | "monthlyRent" | "monthlyExpenses" | "nightlyRate" | "occupancyRate";

const INSIGHT_ST =
  "Short-term rental offers higher potential returns but more volatility.";
const INSIGHT_LT = "Long-term rental provides stable and predictable income.";

const PI_DISMISS_ANALYZE_SAVE_BANNER = "lecipm_pi_dismiss_analyze_save_banner_v1";

function insightCardClass(tone: InsightTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-500/50 bg-emerald-950/45";
    case "warning":
      return "border-amber-500/50 bg-amber-950/40";
    case "danger":
      return "border-red-500/50 bg-red-950/40";
  }
}

/** Green vs red for numeric tiles (ROI / cash flow). */
function resultTileGoodBadClass(isGood: boolean): string {
  return isGood
    ? "border-emerald-500/60 bg-gradient-to-br from-emerald-950/70 to-[#0B0B0B] shadow-[0_0_26px_rgba(16,185,129,0.2)]"
    : "border-red-500/55 bg-gradient-to-br from-red-950/55 to-[#0B0B0B] shadow-[0_0_26px_rgba(239,68,68,0.18)]";
}

/** Green only for Strong Buy; moderate + high risk use red (not “good”). */
function resultTileVerdictClass(tone: InsightTone): string {
  return tone === "success"
    ? "border-emerald-500/60 bg-gradient-to-br from-emerald-950/70 to-[#0B0B0B] shadow-[0_0_26px_rgba(16,185,129,0.2)]"
    : "border-red-500/55 bg-gradient-to-br from-red-950/55 to-[#0B0B0B] shadow-[0_0_26px_rgba(239,68,68,0.18)]";
}

function parseAmount(raw: string): { ok: true; value: number } | { ok: false } {
  const t = raw.trim();
  if (t === "") return { ok: false };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false };
  return { ok: true, value: n };
}

function dispatchFeedbackPrompt(reason: "analysis_complete" | "deal_saved") {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent("lecipm-open-feedback", { detail: { reason } }));
  });
}

export function AnalyzeDealClient({
  isLoggedIn,
  shareReferrerUserId = null,
  monetization = null,
}: {
  isLoggedIn: boolean;
  /** Logged-in user id — adds ?ru= on shared links for referral tracking */
  shareReferrerUserId?: string | null;
  /** Server snapshot for Free vs Pro limits (logged-in only) */
  monetization?: InvestmentMonetizationSnapshot | null;
}) {
  const { showSaveHint } = useProductHealth();
  const { isLowSaveConversion, status: insightsStatus } = useProductInsights();
  const { showToast } = useToast();
  const router = useRouter();
  const [city, setCity] = useState<MarketCity>("Montréal");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [nightlyRate, setNightlyRate] = useState("");
  const [occupancyRate, setOccupancyRate] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [analyzed, setAnalyzed] = useState(false);
  const [comparison, setComparison] = useState<DualStrategyComparison | null>(null);
  const [metrics, setMetrics] = useState<ReturnType<typeof computeDealMetrics> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dealSavedSession, setDealSavedSession] = useState(false);
  const [showFirstSuccess, setShowFirstSuccess] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [dismissedLowSaveBanner, setDismissedLowSaveBanner] = useState(false);
  /** Set when a deal is saved to the account (enables /deal/[id] share) */
  const [savedDealIdForShare, setSavedDealIdForShare] = useState<string | null>(null);
  const postSaveRef = useRef<HTMLDivElement | null>(null);
  const [aiInsight, setAiInsight] = useState<{
    summary: string;
    suggestions: string[];
    source: "openai" | "rules";
  } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(PI_DISMISS_ANALYZE_SAVE_BANNER) === "1") {
        setDismissedLowSaveBanner(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      ensureDemoDealsSeeded();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const draft = readLastDraft();
    if (draft) {
      setCity(draft.city);
      setPropertyPrice(draft.propertyPrice);
      setMonthlyRent(draft.monthlyRent);
      setNightlyRate(draft.nightlyRate);
      setOccupancyRate(draft.occupancyRate);
      setMonthlyExpenses(draft.monthlyExpenses);
    }
    const flags = readActivationFlags();
    if (flags.saved) setDealSavedSession(true);
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const t = window.setTimeout(() => {
      writeLastDraft({
        city,
        propertyPrice,
        monthlyRent,
        nightlyRate,
        occupancyRate,
        monthlyExpenses,
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [draftHydrated, city, propertyPrice, monthlyRent, nightlyRate, occupancyRate, monthlyExpenses]);

  useEffect(() => {
    if (message?.type !== "ok") return;
    const id = window.requestAnimationFrame(() => {
      postSaveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [message?.type]);

  const portfolioHref = isLoggedIn ? "/dashboard" : "/demo/dashboard";
  const compareHref = isLoggedIn ? "/compare" : "/demo/compare";

  const validate = useCallback((): boolean => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const pp = parseAmount(propertyPrice);
    const mr = parseAmount(monthlyRent);
    const me = parseAmount(monthlyExpenses);
    const nr = parseAmount(nightlyRate);
    const oc = parseAmount(occupancyRate);

    if (!pp.ok) errors.propertyPrice = "Enter a valid property price.";
    else if (pp.value <= 0) errors.propertyPrice = "Property price must be greater than zero.";

    if (!mr.ok) errors.monthlyRent = "Enter a valid monthly rent (0 or more).";
    else if (mr.value < 0) errors.monthlyRent = "Monthly rent cannot be negative.";

    if (!nr.ok) errors.nightlyRate = "Enter a valid nightly rate (0 or more).";
    else if (nr.value < 0) errors.nightlyRate = "Nightly rate cannot be negative.";

    if (!oc.ok) errors.occupancyRate = "Enter occupancy as a percentage (0–100).";
    else if (oc.value < 0 || oc.value > 100) errors.occupancyRate = "Occupancy must be between 0% and 100%.";

    if (!me.ok) errors.monthlyExpenses = "Enter valid monthly expenses (0 or more).";
    else if (me.value < 0) errors.monthlyExpenses = "Monthly expenses cannot be negative.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [propertyPrice, monthlyRent, nightlyRate, occupancyRate, monthlyExpenses]);

  function handleAnalyzeDeal(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSavedDealIdForShare(null);
    if (!validate()) {
      setAnalyzed(false);
      setComparison(null);
      setMetrics(null);
      return;
    }
    const pp = parseAmount(propertyPrice);
    const mr = parseAmount(monthlyRent);
    const me = parseAmount(monthlyExpenses);
    const nr = parseAmount(nightlyRate);
    const oc = parseAmount(occupancyRate);
    if (!pp.ok || !mr.ok || !me.ok || !nr.ok || !oc.ok) return;

    const dual = compareRentalStrategies(pp.value, mr.value, me.value, nr.value, oc.value);
    const preferredIncome =
      dual.preferredStrategy === RENTAL_TYPE.SHORT_TERM ? dual.monthlyRevenueShortTerm : dual.monthlyRentLongTerm;
    const m = computeDealMetrics(pp.value, preferredIncome, me.value);

    track(TrackingEvent.INVESTMENT_ANALYZE_RUN, {
      meta: { mode: isLoggedIn ? "account" : "demo", city, preferred: dual.preferredStrategy },
    });
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics] investment_analyze_run", { city, mode: isLoggedIn ? "account" : "demo" });
    }

    setComparison(dual);
    setMetrics(m);
    setAnalyzed(true);
    dispatchFeedbackPrompt("analysis_complete");
    setDealSavedSession(false);
    setSavedDealIdForShare(null);
    setActivationAnalyzed();
    if (shouldShowFirstAnalysisMilestone()) {
      markFirstAnalysisMilestoneShown();
      setShowFirstSuccess(true);
    } else {
      setShowFirstSuccess(false);
    }
    showToast("Analysis complete", "success");
  }

  async function saveDeal() {
    setMessage(null);
    if (!metrics || !comparison || !validate()) {
      setMessage({ type: "err", text: "Run “Analyze deal” with valid numbers first." });
      return;
    }
    const pp = parseAmount(propertyPrice);
    const mr = parseAmount(monthlyRent);
    const me = parseAmount(monthlyExpenses);
    const nr = parseAmount(nightlyRate);
    const oc = parseAmount(occupancyRate);
    if (!pp.ok || !mr.ok || !me.ok || !nr.ok || !oc.ok) return;

    const dual = comparison;
    const preferred = dual.preferredStrategy;
    const roi = preferred === RENTAL_TYPE.SHORT_TERM ? dual.roiShortTerm : dual.roiLongTerm;
    const preferredIncome =
      preferred === RENTAL_TYPE.SHORT_TERM ? dual.monthlyRevenueShortTerm : dual.monthlyRentLongTerm;
    const { monthlyCashFlow } = computeDealMetrics(pp.value, preferredIncome, me.value);
    const { riskScore, rating } = computeInvestmentInsights(roi, monthlyCashFlow);
    const { marketComparison } = compareDealToMarket(roi, city);

    if (!isLoggedIn) {
      setSaving(true);
      try {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `demo-${Date.now()}`;
        const deal: SerializableInvestmentDeal = {
          id,
          rentalType: preferred,
          preferredStrategy: preferred,
          propertyPrice: pp.value,
          monthlyRent: mr.value,
          monthlyExpenses: me.value,
          nightlyRate: nr.value,
          occupancyRate: oc.value,
          roiLongTerm: dual.roiLongTerm,
          roiShortTerm: dual.roiShortTerm,
          roi,
          riskScore,
          rating,
          city,
          marketComparison,
          createdAt: new Date().toISOString(),
        };
        appendDemoDeal(deal);
        track(TrackingEvent.INVESTMENT_DEAL_SAVED, {
          meta: { mode: "demo", city },
        });
        if (process.env.NODE_ENV === "development") {
          console.info("[analytics] investment_deal_saved", { mode: "demo", city });
        }
        setActivationSaved();
        incrementMvpEngagementAction();
        setDealSavedSession(true);
        showToast("Deal saved successfully", "success");
        setMessage({
          type: "ok",
          text: "Saved to your demo portfolio. Your deal is saved. Come back anytime to track your portfolio.",
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    let res: Response;
    try {
      res = await fetch("/api/investment-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          propertyPrice: pp.value,
          monthlyRent: mr.value,
          nightlyRate: nr.value,
          occupancyRate: oc.value,
          monthlyExpenses: me.value,
          city,
        }),
      });
    } catch {
      setSaving(false);
      setMessage({ type: "err", text: "Could not save deal." });
      return;
    }

    if (res.status === 401) {
      setSaving(false);
      router.push(`/auth/login?next=${encodeURIComponent("/analyze")}`);
      return;
    }

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
      code?: string;
      upgrade?: boolean;
    };

    try {
      if (res.status === 403 && data.code === "INVESTMENT_DEAL_LIMIT") {
        track(TrackingEvent.INVESTMENT_PLAN_LIMIT_HIT, {
          meta: {
            source: "analyze_save",
            savedDealCount: monetization?.savedDealCount,
          },
        });
        showToast(INVESTMENT_LIMIT_MESSAGE, "info");
        setMessage({
          type: "err",
          text: data.error ?? INVESTMENT_LIMIT_MESSAGE,
        });
        return;
      }
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Could not save deal." });
        return;
      }
      if (typeof data.id === "string") {
        setSavedDealIdForShare(data.id);
      }
      track(TrackingEvent.INVESTMENT_DEAL_SAVED, {
        meta: { mode: "account", city },
      });
      setActivationSaved();
      incrementMvpEngagementAction();
      setDealSavedSession(true);
      dispatchFeedbackPrompt("deal_saved");
      showToast("Deal saved successfully", "success");
      setMessage({
        type: "ok",
        text: "Synced to your account. Your deal is saved. Come back anytime to track your portfolio.",
      });
    } finally {
      setSaving(false);
    }
  }

  function clearResultsAfterEdit() {
    setAnalyzed(false);
    setComparison(null);
    setMetrics(null);
    setMessage(null);
    setSavedDealIdForShare(null);
    setDealSavedSession(false);
    setShowFirstSuccess(false);
  }

  const insights = useMemo(() => {
    if (!metrics || !analyzed) return null;
    return computeInvestmentInsights(metrics.roi, metrics.monthlyCashFlow);
  }, [metrics, analyzed]);

  const marketInsights = useMemo(() => {
    if (!metrics || !analyzed) return null;
    return compareDealToMarket(metrics.roi, city);
  }, [metrics, analyzed, city]);

  const occupancySensitivity = useMemo(() => {
    if (!comparison || !analyzed) return null;
    const nr = parseAmount(nightlyRate);
    const oc = parseAmount(occupancyRate);
    if (!nr.ok || !oc.ok) return null;
    return occupancySensitivityDelta(nr.value, oc.value, 10);
  }, [comparison, analyzed, nightlyRate, occupancyRate]);

  const illustrativeMortgagePayment = useMemo(() => {
    if (!analyzed) return null;
    const pp = parseAmount(propertyPrice);
    if (!pp.ok || pp.value <= 0) return null;
    return approximateMonthlyMortgagePayment(pp.value);
  }, [analyzed, propertyPrice]);

  /** Platform mortgage contact — assigns a verified expert or queues for the expert marketplace (see POST /api/mortgage/lead). */
  const mortgageContactHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("from", "analyze");
    const pp = parseAmount(propertyPrice);
    if (pp.ok && pp.value > 0) qs.set("purchasePrice", String(Math.round(pp.value)));
    if (city) qs.set("purchaseRegion", city);
    return `/mortgage?${qs.toString()}#request-contact`;
  }, [propertyPrice, city]);

  const errorBorder = "border-red-500/60";
  const okBorder = "border-white/15";
  const inputClass =
    "mt-2 min-h-[48px] w-full rounded-xl border bg-black/30 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/45";

  const ltWins = comparison && !comparison.shortTermWinsOnRoi;
  const stWins = comparison?.shortTermWinsOnRoi;

  const showLowSaveBanner =
    insightsStatus === "ready" && isLowSaveConversion && !dismissedLowSaveBanner;
  const pulseSaveCta = showLowSaveBanner;

  const showMobileStickySave =
    analyzed &&
    metrics &&
    comparison &&
    insights &&
    marketInsights &&
    !dealSavedSession &&
    message?.type !== "ok" &&
    !(isLoggedIn && monetization?.isAtOrOverFreeLimit);

  useEffect(() => {
    if (!analyzed || !metrics || !comparison) return;
    const pp = parseAmount(propertyPrice);
    const mr = parseAmount(monthlyRent);
    const me = parseAmount(monthlyExpenses);
    const nr = parseAmount(nightlyRate);
    const oc = parseAmount(occupancyRate);
    if (!pp.ok || !mr.ok || !me.ok || !nr.ok || !oc.ok) return;

    let cancelled = false;
    setAiInsightLoading(true);
    setAiInsight(null);

    const payload = {
      city,
      propertyPrice: pp.value,
      monthlyRentLongTerm: mr.value,
      monthlyExpenses: me.value,
      nightlyRate: nr.value,
      occupancyPercent: oc.value,
      roiLongTerm: comparison.roiLongTerm,
      roiShortTerm: comparison.roiShortTerm,
      roiPreferred: metrics.roi,
      monthlyCashFlow: metrics.monthlyCashFlow,
      shortTermWinsOnRoi: comparison.shortTermWinsOnRoi,
    };

    void fetch("/api/ai/investment-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          summary?: string;
          suggestions?: unknown;
          source?: string;
        };
        if (cancelled) return;
        if (json.ok && typeof json.summary === "string") {
          const suggestions = Array.isArray(json.suggestions)
            ? json.suggestions.filter((s): s is string => typeof s === "string")
            : [];
          setAiInsight({
            summary: json.summary,
            suggestions,
            source: json.source === "openai" ? "openai" : "rules",
          });
        } else {
          const fb = buildRuleBasedInvestmentInsight(payload);
          setAiInsight({ ...fb, source: "rules" });
        }
      })
      .catch(() => {
        if (cancelled) return;
        const fb = buildRuleBasedInvestmentInsight(payload);
        setAiInsight({ ...fb, source: "rules" });
      })
      .finally(() => {
        if (!cancelled) setAiInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    analyzed,
    metrics,
    comparison,
    city,
    propertyPrice,
    monthlyRent,
    monthlyExpenses,
    nightlyRate,
    occupancyRate,
  ]);

  /** Deep links like `/analyze#roi-insights` — scroll after paint; re-run when results mount. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToHash = () => {
      const raw = window.location.hash;
      if (!raw || raw.length < 2) return;
      const id = raw.slice(1);
      if (id !== "roi-insights" && id !== "analyzer" && id !== "mortgage-calculator" && id !== "mortgage-hub")
        return;
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToHash();
    const t = window.setTimeout(scrollToHash, 200);
    return () => window.clearTimeout(t);
  }, [analyzed]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 overflow-x-hidden pb-2 sm:space-y-10">
      {showLowSaveBanner ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-50 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="font-medium">
            Most users don&apos;t save their deals — don&apos;t lose yours.
          </p>
          <button
            type="button"
            className="shrink-0 self-end text-xs text-amber-200/80 underline hover:text-white sm:self-auto"
            onClick={() => {
              try {
                localStorage.setItem(PI_DISMISS_ANALYZE_SAVE_BANNER, "1");
              } catch {
                /* ignore */
              }
              setDismissedLowSaveBanner(true);
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <p
        className="rounded-xl border border-premium-gold/25 bg-[#14110a]/50 px-4 py-3 text-center text-sm text-[#d4c9a8] md:text-left"
        role="status"
      >
        <strong className="text-premium-gold">Compare both strategies:</strong> enter long-term rent and short-term nightly rate
        + occupancy — we show both ROIs side by side.
      </p>

      <form
        id="analyzer"
        onSubmit={(e) => void handleAnalyzeDeal(e)}
        className="scroll-mt-28 space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:space-y-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-white">Deal inputs</h2>
        <p className="text-sm text-slate-400 sm:block">
          All amounts in CAD — essentials only to compare long-term vs short-term.
        </p>

        <div>
          <label htmlFor="city" className="text-sm font-medium text-slate-200">
            City <span className="text-red-400">*</span>
          </label>
          <select
            id="city"
            name="city"
            value={city}
            onChange={(e) => {
              setCity(e.target.value as MarketCity);
              clearResultsAfterEdit();
            }}
            className={`${inputClass} cursor-pointer bg-[#0B0B0B] ${okBorder}`}
          >
            {QUEBEC_CITY_GROUPS.map(({ label, cities }) => (
              <optgroup key={label} label={label}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">Regional mock benchmark only.</p>
        </div>

        <div>
          <label htmlFor="propertyPrice" className="text-sm font-medium text-slate-200">
            Property price <span className="text-red-400">*</span>
          </label>
          <input
            id="propertyPrice"
            name="propertyPrice"
            type="number"
            inputMode="decimal"
            min={0}
            step="1000"
            value={propertyPrice}
            onChange={(e) => {
              setPropertyPrice(e.target.value);
              setFieldErrors((f) => ({ ...f, propertyPrice: undefined }));
              clearResultsAfterEdit();
            }}
            className={`${inputClass} ${fieldErrors.propertyPrice ? errorBorder : okBorder}`}
            placeholder="e.g. 450000"
            aria-invalid={!!fieldErrors.propertyPrice}
            aria-describedby={fieldErrors.propertyPrice ? "err-propertyPrice" : undefined}
          />
          {fieldErrors.propertyPrice ? (
            <p id="err-propertyPrice" className="mt-1.5 text-sm text-red-400">
              {fieldErrors.propertyPrice}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="monthlyRent" className="text-sm font-medium text-slate-200">
            Monthly rent (long-term) <span className="text-red-400">*</span>
          </label>
          <input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            inputMode="decimal"
            min={0}
            step="100"
            value={monthlyRent}
            onChange={(e) => {
              setMonthlyRent(e.target.value);
              setFieldErrors((f) => ({ ...f, monthlyRent: undefined }));
              clearResultsAfterEdit();
            }}
            className={`${inputClass} ${fieldErrors.monthlyRent ? errorBorder : okBorder}`}
            placeholder="e.g. 2800"
            aria-invalid={!!fieldErrors.monthlyRent}
          />
          {fieldErrors.monthlyRent ? (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.monthlyRent}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="nightlyRate" className="text-sm font-medium text-slate-200">
            Nightly rate — short-term (CAD) <span className="text-red-400">*</span>
          </label>
          <input
            id="nightlyRate"
            name="nightlyRate"
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={nightlyRate}
            onChange={(e) => {
              setNightlyRate(e.target.value);
              setFieldErrors((f) => ({ ...f, nightlyRate: undefined }));
              clearResultsAfterEdit();
            }}
            className={`${inputClass} ${fieldErrors.nightlyRate ? errorBorder : okBorder}`}
            placeholder="e.g. 180"
            aria-invalid={!!fieldErrors.nightlyRate}
          />
          {fieldErrors.nightlyRate ? (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.nightlyRate}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="occupancyRate" className="text-sm font-medium text-slate-200">
            Occupancy rate (%) — short-term <span className="text-red-400">*</span>
          </label>
          <input
            id="occupancyRate"
            name="occupancyRate"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="1"
            value={occupancyRate}
            onChange={(e) => {
              setOccupancyRate(e.target.value);
              setFieldErrors((f) => ({ ...f, occupancyRate: undefined }));
              clearResultsAfterEdit();
            }}
            className={`${inputClass} ${fieldErrors.occupancyRate ? errorBorder : okBorder}`}
            placeholder="e.g. 65"
            aria-invalid={!!fieldErrors.occupancyRate}
          />
          {fieldErrors.occupancyRate ? (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.occupancyRate}</p>
          ) : null}
          <p className="mt-1.5 hidden text-xs text-slate-500 sm:block">
            Short-term revenue uses nightly × (occupancy ÷ 100) × 30 nights.
          </p>
        </div>

        <div>
          <label htmlFor="monthlyExpenses" className="text-sm font-medium text-slate-200">
            Monthly expenses <span className="text-red-400">*</span>
          </label>
          <input
            id="monthlyExpenses"
            name="monthlyExpenses"
            type="number"
            inputMode="decimal"
            min={0}
            step="50"
            value={monthlyExpenses}
            onChange={(e) => {
              setMonthlyExpenses(e.target.value);
              setFieldErrors((f) => ({ ...f, monthlyExpenses: undefined }));
              clearResultsAfterEdit();
            }}
            className={`${inputClass} ${fieldErrors.monthlyExpenses ? errorBorder : okBorder}`}
            placeholder="Taxes, insurance, HOA, maintenance…"
            aria-invalid={!!fieldErrors.monthlyExpenses}
          />
          {fieldErrors.monthlyExpenses ? (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.monthlyExpenses}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={analyzing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {analyzing ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"
                aria-hidden
              />
              Calculating…
            </>
          ) : (
            "Analyze deal"
          )}
        </button>
      </form>

      <section
        id="roi-insights"
        className="scroll-mt-28 space-y-6 pb-20 lg:pb-0"
        aria-live="polite"
      >
        {analyzed && metrics && comparison && insights && marketInsights ? (
          <>
            {message?.type === "ok" ? (
              <div
                ref={postSaveRef}
                className="rounded-2xl border-2 border-emerald-400/55 bg-gradient-to-br from-emerald-950/70 to-slate-950 p-6 shadow-[0_0_40px_rgba(16,185,129,0.22)]"
                role="status"
              >
              <p className="text-lg font-bold text-white sm:text-xl">
                Deal saved <span aria-hidden>🎉</span> View your portfolio or compare it with others
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">{message.text}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={portfolioHref}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/35 transition hover:bg-emerald-400 sm:max-w-[220px]"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href={compareHref}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] px-6 py-3 text-sm font-semibold text-white hover:bg-white/12 sm:max-w-[220px]"
                >
                  Compare Deals
                </Link>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <WasThisHelpfulLazy context="after_save" />
              </div>
            </div>
          ) : null}

          {message?.type !== "ok" ? (
            <div
              className="rounded-2xl border border-emerald-500/45 bg-emerald-950/45 px-4 py-4 sm:px-6"
              role="status"
            >
              <p className="text-base font-semibold leading-snug text-white sm:text-lg">
                Great — your deal is ready. You can now save it or request financing.
              </p>
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-semibold text-white sm:text-lg">Your results</h2>
            <p className="mt-1 text-sm text-slate-500">
              Higher ROI wins; ties favor long-term. Key numbers below — financing is illustrative.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="ROI, cash flow, and AI verdict">
            {(() => {
              const roiOk = metrics.roi >= 5;
              const cfOk = metrics.monthlyCashFlow >= 0;
              const verdictTone = getInsightTone(insights.rating);
              return (
                <>
                  <div
                    className={`rounded-2xl border p-5 text-center sm:p-6 ${resultTileGoodBadClass(roiOk)}`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${roiOk ? "text-emerald-300" : "text-red-300"}`}
                    >
                      ROI
                    </p>
                    <p className="mt-3 font-mono text-4xl font-bold tabular-nums leading-none text-white sm:text-5xl">
                      {formatRoiPercent(metrics.roi)}
                    </p>
                    <p className={`mt-2 text-xs font-medium ${roiOk ? "text-emerald-200/90" : "text-red-200/90"}`}>
                      {roiOk ? "On target (≥ 5% cash-on-cash)" : "Below typical target (&lt; 5%)"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Preferred strategy</p>
                  </div>
                  <div
                    className={`rounded-2xl border p-5 text-center sm:p-6 ${resultTileGoodBadClass(cfOk)}`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${cfOk ? "text-emerald-300" : "text-red-300"}`}
                    >
                      Cash flow / mo
                    </p>
                    <p className="mt-3 font-mono text-3xl font-bold tabular-nums leading-none text-white sm:text-4xl">
                      {formatCurrencyCAD(metrics.monthlyCashFlow)}
                    </p>
                    <p className={`mt-2 text-xs font-medium ${cfOk ? "text-emerald-200/90" : "text-red-200/90"}`}>
                      {cfOk ? "Positive monthly cash flow" : "Negative monthly cash flow"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">After expenses</p>
                  </div>
                  <div
                    className={`rounded-2xl border p-5 text-center sm:p-6 ${resultTileVerdictClass(verdictTone)}`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${verdictTone === "success" ? "text-emerald-300" : "text-red-300"}`}
                    >
                      AI insight
                    </p>
                    <p className="mt-3 text-base font-bold leading-snug text-white sm:text-lg">{insights.rating}</p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
                      {insights.riskScore}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Risk score · 0 low — 100 high</p>
                    <p
                      className={`mt-2 text-xs font-medium ${verdictTone === "success" ? "text-emerald-200/90" : "text-red-200/90"}`}
                    >
                      {verdictTone === "success"
                        ? "Favourable outlook"
                        : verdictTone === "danger"
                          ? "Higher risk — review assumptions"
                          : "Moderate — validate numbers and stress-test rent"}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-[#0B0B0B] p-5 text-center shadow-lg sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">Approval estimate</p>
            <p className="mt-3 font-mono text-3xl font-bold tabular-nums leading-none text-white sm:text-4xl">
              {illustrativeMortgagePayment !== null ? formatCurrencyCAD(illustrativeMortgagePayment) : "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Illustrative P&amp;I · 80% LTV, 5.5%, 25y — not an offer
            </p>
            <Link
              href={mortgageContactHref}
              className="mt-3 inline-block text-xs font-semibold text-premium-gold underline hover:text-premium-gold"
            >
              Request a real approval estimate
            </Link>
          </div>

          <p className="text-center text-sm text-slate-400">
            <strong className="text-white">Strategy:</strong>{" "}
            {stWins ? "Short-term" : "Long-term"} leads on ROI
            {stWins ? " (higher volatility)" : " (more stable)"}
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <WasThisHelpfulLazy context="analyze_results" />
          </div>

          <AiInvestmentInsightCard
            loading={aiInsightLoading}
            summary={aiInsight?.summary ?? null}
            suggestions={aiInsight?.suggestions ?? []}
            source={aiInsight?.source ?? null}
          />

          <div
            className={`rounded-2xl border px-4 py-5 text-center sm:px-6 ${
              stWins
                ? "border-emerald-500/50 bg-emerald-950/40"
                : "border-sky-500/40 bg-sky-950/35"
            }`}
            role="status"
          >
            <p className="text-lg font-bold text-white">
              {stWins ? "Short-term is more profitable" : "Long-term is more stable"}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Based on cash-on-cash ROI: ST {formatRoiPercent(comparison.roiShortTerm)} vs LT{" "}
              {formatRoiPercent(comparison.roiLongTerm)}
            </p>
          </div>

          <ShareAnalysisIncentiveCardLazy
            dealId={savedDealIdForShare}
            referrerUserId={shareReferrerUserId}
            shareVariant={isLoggedIn ? "live" : "demo"}
          />

          {showFirstSuccess && message?.type !== "ok" ? (
            <div
              className="rounded-2xl border border-emerald-500/45 bg-emerald-950/40 px-4 py-4 text-center text-emerald-50 sm:px-6"
              role="status"
            >
              <p className="text-lg font-semibold text-white">
                You&apos;re already making smarter investment decisions <span aria-hidden>🚀</span>
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                Next: save this deal so you can track performance and compare with others.
              </p>
            </div>
          ) : null}

          {!dealSavedSession && message?.type !== "ok" ? (
            isLoggedIn && monetization?.isAtOrOverFreeLimit ? (
              <section
                className="rounded-2xl border-2 border-amber-500/55 bg-gradient-to-br from-amber-950/50 via-slate-950 to-slate-950 p-6 shadow-[0_0_28px_rgba(245,158,11,0.12)] sm:p-7"
                aria-labelledby="upgrade-deal-heading"
              >
                <h3 id="upgrade-deal-heading" className="text-lg font-bold leading-snug text-white sm:text-xl">
                  {INVESTMENT_LIMIT_MESSAGE}
                </h3>
                <p className="mt-2 text-sm text-amber-100/90">{PRO_VALUE_LINES.serious}</p>
                <p className="mt-1 text-sm text-slate-400">{PRO_VALUE_LINES.unlock}</p>
                <p className="mt-3 text-sm text-slate-500">
                  Free plan includes up to {monetization.maxFreeDeals} saved deals. You’re at your limit — upgrade to keep
                  saving analyses to your account.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <UpgradeToProLink
                    source="analyze_limit"
                    className="inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-full bg-amber-500 px-8 py-3 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400"
                  />
                  <Link
                    href="/pricing"
                    className="text-sm font-medium text-slate-400 underline hover:text-white"
                  >
                    See plans
                  </Link>
                </div>
              </section>
            ) : (
              <section
                className="hidden rounded-2xl border-2 border-emerald-500/55 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 p-6 shadow-[0_0_36px_rgba(16,185,129,0.14)] sm:p-7 lg:block"
                aria-labelledby="save-deal-heading"
              >
                <h3 id="save-deal-heading" className="text-lg font-bold leading-snug text-white sm:text-xl">
                  This deal looks promising. Save it to track performance and compare with others.
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  One tap adds it to your portfolio — then open Compare when you have two or more deals saved.
                </p>
                {isLoggedIn && monetization && !monetization.isPro ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Free plan: {monetization.savedDealCount}/{monetization.maxFreeDeals} deals saved to your account.
                  </p>
                ) : null}
                <div className="mt-6 flex justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => void saveDeal()}
                    disabled={saving || analyzing}
                    title={
                      showSaveHint
                        ? "Tip: save this analysis to your portfolio so you can compare deals later."
                        : undefined
                    }
                    className={`inline-flex w-full min-h-[58px] max-w-md items-center justify-center rounded-full bg-emerald-500 px-10 py-4 text-lg font-extrabold tracking-tight text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 ${
                      pulseSaveCta ? "animate-lecipm-save-pulse ring-2 ring-amber-300/90" : "animate-lecipm-save-pulse ring-2 ring-emerald-300/70"
                    }`}
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        Saving…
                      </span>
                    ) : (
                      "Save Deal"
                    )}
                  </button>
                </div>
              </section>
            )
          ) : null}

          <div className="hidden md:block">
            <ActivationProgressStepsLazy analyzed={analyzed} saved={dealSavedSession} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Strategy comparison</h2>
            <p className="mt-1 text-sm text-slate-500">Full breakdown by strategy.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-2xl border p-5 transition ${
                ltWins ? "border-emerald-500/60 bg-emerald-950/30 ring-2 ring-emerald-500/50" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Long-term rental</h3>
              <p className="mt-4 font-mono text-3xl font-bold text-white">{formatRoiPercent(comparison.roiLongTerm)}</p>
              <p className="text-xs text-slate-500">ROI (cash-on-cash)</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Monthly cash flow</dt>
                  <dd className="font-mono text-slate-200">{formatCurrencyCAD(comparison.monthlyCashFlowLT)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Annual cash flow</dt>
                  <dd className="font-mono text-slate-200">{formatCurrencyCAD(comparison.annualCashFlowLT)}</dd>
                </div>
              </dl>
            </div>
            <div
              className={`rounded-2xl border p-5 transition ${
                stWins ? "border-emerald-500/60 bg-emerald-950/30 ring-2 ring-emerald-500/50" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Short-term rental</h3>
              <p className="mt-4 font-mono text-3xl font-bold text-white">{formatRoiPercent(comparison.roiShortTerm)}</p>
              <p className="text-xs text-slate-500">ROI (cash-on-cash)</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Est. monthly revenue</dt>
                  <dd className="font-mono text-slate-200">{formatCurrencyCAD(comparison.monthlyRevenueShortTerm)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Monthly cash flow</dt>
                  <dd className="font-mono text-slate-200">{formatCurrencyCAD(comparison.monthlyCashFlowST)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Annual cash flow</dt>
                  <dd className="font-mono text-slate-200">{formatCurrencyCAD(comparison.annualCashFlowST)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Insights</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">
              <li>{INSIGHT_ST}</li>
              <li>{INSIGHT_LT}</li>
            </ul>
            {occupancySensitivity ? (
              <p className="mt-4 text-xs text-slate-500">
                <strong className="text-slate-400">Occupancy sensitivity:</strong> −10 pp occupancy ≈{" "}
                {formatCurrencyCAD(occupancySensitivity.deltaMonthly)} less monthly revenue (short-term).
              </p>
            ) : null}
          </div>

          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-white">Preferred strategy (summary)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Rating & risk use the stronger ROI strategy. Risk score 0–100 (higher = more risk). Informational only.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5 sm:p-6 md:block">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-300">Market comparison</h3>
            <p className="mt-1 text-xs text-slate-500">
              Mock benchmark for <strong className="text-slate-400">{city}</strong>: avg cash-on-cash ROI ~{marketInsights.avgROI}%
              (illustrative).
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-xl border p-4 ${insightCardClass(getMarketComparisonTone(marketInsights.marketComparison))}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Market comparison</p>
                <p className="mt-2 text-lg font-bold text-white">{marketInsights.marketComparison}</p>
                <span className={`mt-2 inline-block ${insightPillClass(getMarketComparisonTone(marketInsights.marketComparison))}`}>
                  vs {marketInsights.avgROI}% avg
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Market risk level</p>
                <p className="mt-2 text-lg font-bold text-white">{marketInsights.marketRiskLevel}</p>
                <p className="mt-1 text-xs text-slate-500">Regional mock profile</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Performance vs market</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-white">{marketInsights.performanceVsMarket}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{marketInsights.insightMessage}</p>
          </div>
          <div className="hidden grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:grid">
            <div
              className={`rounded-2xl border p-5 shadow-lg ${insightCardClass(getInsightTone(insights.rating))}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Investment rating</p>
              <p className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl">{insights.rating}</p>
              <p className="mt-2 text-xs text-slate-400">Based on preferred strategy ROI and cash flow</p>
            </div>
            <div className={`rounded-2xl border p-5 ${insightCardClass(getRiskScoreTone(insights.riskScore))}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Risk score</p>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{insights.riskScore}</p>
              <p className="mt-2 text-xs text-slate-400">0 = lower risk · 100 = higher risk</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/50 to-slate-950 p-5 shadow-lg shadow-emerald-900/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">ROI (preferred)</p>
              <p className="mt-3 font-mono text-3xl font-bold text-white">{formatRoiPercent(metrics.roi)}</p>
              <p className="mt-2 text-xs text-slate-400">Annual cash-on-cash vs. purchase price</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Monthly cash flow</p>
              <p className="mt-3 font-mono text-2xl font-bold text-white">{formatCurrencyCAD(metrics.monthlyCashFlow)}</p>
              <p className="mt-2 text-xs text-slate-500">Preferred strategy: income − expenses</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Annual cash flow</p>
              <p className="mt-3 font-mono text-2xl font-bold text-white">{formatCurrencyCAD(metrics.annualCashFlow)}</p>
              <p className="mt-2 text-xs text-slate-500">× 12 months</p>
            </div>
          </div>

          {message?.type === "err" ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-300"
            >
              <p>{message.text}</p>
              {message.text.includes("Upgrade to Pro") ? (
                <p className="mt-3">
                  <UpgradeToProLink
                    source="analyze_error"
                    className="inline-flex rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100 ring-1 ring-red-400/40 hover:bg-red-500/30"
                  />
                </p>
              ) : null}
            </div>
          ) : null}

            {!isLoggedIn ? (
              <p className="hidden text-sm text-slate-500 md:block">
                <Link
                  href={`/auth/login?next=${encodeURIComponent("/analyze")}`}
                  className="text-premium-gold underline hover:text-premium-gold"
                >
                  Sign in
                </Link>{" "}
                to sync saves to your account. Until then, demo saves stay in this browser.
              </p>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-b from-[#14110a]/90 to-[#0B0B0B] px-4 py-6 text-center shadow-inner shadow-black/20 sm:px-8 sm:py-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">After you analyze</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">ROI &amp; insights</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              This panel fills in automatically after you run the deal analyzer. You’ll see ROI, monthly cash flow, and an AI
              summary here — nothing is wrong; we just need your numbers first. Use the{" "}
              <a href="#mortgage-calculator" className="font-medium text-premium-gold hover:underline">
                mortgage calculator
              </a>{" "}
              and{" "}
              <a href="#mortgage-hub" className="font-medium text-premium-gold hover:underline">
                platform mortgage contact
              </a>{" "}
              above anytime.
            </p>
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "ROI", sub: "Cash-on-cash" },
                { label: "Cash flow", sub: "Per month" },
                { label: "AI insight", sub: "Summary" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 sm:py-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
                  <p className="mt-1.5 text-[11px] text-slate-600">{row.sub}</p>
                  <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-slate-600 sm:text-xl">—</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-6 w-full max-w-sm rounded-xl bg-premium-gold px-4 py-3.5 text-sm font-extrabold text-[#0B0B0B] shadow-[0_8px_28px_rgb(var(--premium-gold-channels) / 0.25)] transition hover:brightness-110 sm:mx-auto"
            >
              Go to deal inputs
            </button>
            <p className="mt-4 text-xs text-slate-500">
              Scroll up to the <strong className="text-slate-400">Deal inputs</strong> section, fill the fields, then tap{" "}
              <strong className="text-premium-gold">Analyze deal</strong>.
            </p>
          </div>
        )}
      </section>

      {showMobileStickySave ? (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-[55] border-t border-white/10 bg-[#0B0B0B]/95 px-4 py-2.5 text-center backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => void saveDeal()}
            disabled={saving || analyzing}
            className={`flex min-h-[48px] w-full items-center justify-center rounded-xl bg-premium-gold px-4 py-3 text-base font-extrabold text-[#0B0B0B] transition hover:bg-premium-gold disabled:opacity-50 ${
              pulseSaveCta ? "ring-2 ring-amber-400/60" : ""
            }`}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B0B0B] border-t-transparent" />
                Saving…
              </span>
            ) : (
              "Save Deal"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
