"use client";

import { useEffect, useState } from "react";
import type { OnboardingRole } from "@/modules/onboarding/onboardingService";
import { runOnboardingAnalysis, type OnboardingAnalysisResult } from "@/modules/onboarding/onboardingService";
import { OnboardingWizard } from "@/components/conversion/OnboardingWizard";
import { AISuggestionCards } from "@/components/conversion/AISuggestionCards";
import { UrgencyBadge } from "@/components/conversion/UrgencyBadge";
import { UpgradeModal } from "@/components/conversion/UpgradeModal";
import { ConversionCtaBanner } from "@/components/conversion/ConversionCtaBanner";
import { track } from "@/lib/tracking";
import { conversionCopy } from "@/src/design/conversionCopy";
import { DealExplainerCard } from "@/components/ai/DealExplainerCard";

const STEPS = ["Role", "Property", "Result"] as const;

export default function OnboardingPageClient() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<OnboardingRole>("broker");
  const [propertyInput, setPropertyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingAnalysisResult | null>(null);
  const [nudges, setNudges] = useState<Array<{ title: string; body: string; tone: "positive" | "warning" | "neutral" }>>([]);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [autoSeedLoaded, setAutoSeedLoaded] = useState(false);
  const [urgency, setUrgency] = useState<{ level: "high" | "medium" | "early"; label: string } | null>(null);

  async function handleRunAnalysis() {
    if (!propertyInput.trim()) {
      setError(conversionCopy.microcopy.empty);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await runOnboardingAnalysis({ role, propertyInput: propertyInput.trim() });
      setResult(r);
      setStep(3);
      const tracked = await fetch("/api/conversion/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "analysis_run",
          dealScore: r.dealScore,
          trustScore: r.trustScore,
          timeSpentSec: 150,
        }),
      }).then((x) => x.json()).catch(() => null);
      if (tracked?.nudges) setNudges(tracked.nudges);
      if (Array.isArray(tracked?.triggers) && tracked.triggers.length) {
        setUpgradeReason("You reached a high-conversion threshold. Upgrade to unlock advanced automation.");
      }
      if (r.dealScore >= 75) {
        setUrgency({ level: "high", label: "High demand deal" });
      } else if (r.dealScore >= 60) {
        setUrgency({ level: "medium", label: "Rising opportunity" });
      } else {
        setUrgency({ level: "early", label: "Early signal" });
      }
      track("conversion_track", { meta: { event: "first_analysis_viewed", role, verdict: r.verdict } });
    } catch (e) {
      setError(e instanceof Error ? e.message : conversionCopy.microcopy.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoSeedLoaded) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/conversion/insights").catch(() => null);
      if (!res?.ok) {
        setAutoSeedLoaded(true);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!active || !data?.onboardingSeed?.propertyInput) return;
      setPropertyInput(data.onboardingSeed.propertyInput);
      setAutoSeedLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [autoSeedLoaded]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">LECIPM onboarding</h1>
        <p className="mt-2 text-sm text-slate-400">{conversionCopy.onboarding.welcomeTitle}</p>

        <OnboardingWizard step={step} total={STEPS.length} label={STEPS[step - 1]} />

        {step === 1 ? (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-medium">{conversionCopy.onboarding.progressStep1}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["broker", "investor", "buyer"] as OnboardingRole[]).map((r, idx) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    track("conversion_track", { meta: { event: "role_selected", role: r } });
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    role === r
                      ? "border-amber-400 bg-amber-400/10 text-amber-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {conversionCopy.onboarding.roleOptions[idx] ?? r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-medium">{conversionCopy.onboarding.propertyPrompt}</h2>
            <p className="text-sm text-slate-400">Paste Zillow/Airbnb URL or a plain address (e.g. 123 Main St, Montreal, QC).</p>
            <textarea
              value={propertyInput}
              onChange={(e) => setPropertyInput(e.target.value)}
              placeholder="https://www.zillow.com/... or https://www.airbnb.com/... or address"
              className="h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-amber-400"
            />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-medium">{conversionCopy.onboarding.resultPrompt}</h2>
            {result ? (
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="text-sm text-slate-300">{result.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Metric label={conversionCopy.analysis.trustScoreLabel} value={result.trustScore} />
                  <Metric label={conversionCopy.analysis.dealScoreLabel} value={result.dealScore} />
                </div>
                <div className="mt-3">
                  <UrgencyBadge
                    level={urgency?.level ?? (result.dealScore >= 70 ? "high" : result.dealScore >= 60 ? "medium" : "early")}
                    label={
                      urgency?.label ??
                      (result.verdict === "strong_deal"
                        ? conversionCopy.analysis.recommendationHigh
                        : result.verdict === "high_risk"
                          ? conversionCopy.analysis.recommendationLow
                          : conversionCopy.analysis.recommendationMedium)
                    }
                  />
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  Verdict: <strong className="text-amber-300">{result.verdict}</strong>
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                  {result.insights.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <DealExplainerCard
                    explanationText={result.summary}
                    expandedExplanationText={
                      result.insights.length > 1 ? result.insights.slice(1).join(" ") : undefined
                    }
                    reasons={result.verdict === "high_risk" ? [] : result.insights}
                    warnings={result.verdict === "high_risk" ? result.insights : []}
                    recommendation={
                      result.verdict === "strong_deal"
                        ? conversionCopy.analysis.recommendationHigh
                        : result.verdict === "needs_review"
                          ? conversionCopy.analysis.recommendationMedium
                          : conversionCopy.analysis.recommendationLow
                    }
                    scoreLevel={
                      result.verdict === "strong_deal"
                        ? "high"
                        : result.verdict === "needs_review"
                          ? "medium"
                          : "low"
                    }
                    confidencePercent={
                      result.verdict === "strong_deal" ? 72 : result.verdict === "needs_review" ? 55 : 38
                    }
                    confidenceExplanation={
                      result.verdict === "strong_deal"
                        ? "Heuristic model aligns with a favorable snapshot — validate with a full listing analysis."
                        : result.verdict === "needs_review"
                          ? "Signals are mixed; use the full platform workflow before a firm decision."
                          : "Elevated risk signals in the quick scan — widen diligence and document checks."
                    }
                    dealScore={result.dealScore}
                    trustScore={result.trustScore}
                    baseRoiPercent={null}
                    factorDataSourceLabel="Onboarding analysis (heuristic)"
                    contactHref="/lead-marketplace"
                    requestInfoHref="/onboarding"
                    saveHref="/dashboard"
                    analyzeDeeperHref="/analysis"
                  />
                </div>
                <AISuggestionCards items={nudges} />
                <ConversionCtaBanner
                  title="Move from analysis to lead"
                  subtitle="Create a lead now and activate automated follow-ups based on trust and deal signals."
                  ctaHref="/lead-marketplace"
                  ctaLabel="Open lead workflow"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400">{conversionCopy.microcopy.empty}</p>
            )}
          </section>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              onMouseDown={() => track("conversion_track", { meta: { event: "onboarding_step_completed", step: 1 } })}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
            >
              {conversionCopy.onboarding.ctaNext}
            </button>
          ) : null}

          {step === 2 ? (
            <button
              type="button"
              onClick={handleRunAnalysis}
              onMouseDown={() => track("conversion_track", { meta: { event: "onboarding_step_completed", step: 2 } })}
              disabled={loading}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? conversionCopy.microcopy.loading : conversionCopy.onboarding.ctaRun}
            </button>
          ) : null}

          {step === 3 ? (
            <a
              href="/auth/signup?next=/analysis"
              onMouseDown={() => track("conversion_trigger", { meta: { event: "upgrade_clicked_from_onboarding" } })}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              {conversionCopy.onboarding.ctaUnlock}
            </a>
          ) : null}
        </div>
      </div>
      <UpgradeModal open={Boolean(upgradeReason)} reason={upgradeReason ?? undefined} onClose={() => setUpgradeReason(null)} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
