"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { trackEvent } from "@/src/services/analytics";

const DEMO_CITY = "Montreal";
const MO_LISTINGS = [
  { id: "demo-1", title: "Sunny Plateau 2BR", city: "Montreal" },
  { id: "demo-2", title: "Old Port studio with river view", city: "Montreal" },
  { id: "demo-3", title: "Mile End townhouse", city: "Montreal" },
] as const;

const MOCK_PRICING = {
  headline: `AI detected high demand in ${DEMO_CITY}`,
  recommendation: "Increase prices by 10%",
  reason: "High demand detected from views and bookings (demo fallback).",
} as const;

const MOCK_TRUST = {
  bullets: ["Listings verified", "OACIQ-compliant process", "Secure transactions"] as const,
};

const MOCK_OPT = {
  analyzed: "Campaign analyzed",
  recommendation: "Improve copy",
  sampleCopy:
    "Find your next Montréal stay — verified listings, secure booking, and local market intelligence.",
} as const;

const STEP_LABELS = ["Search", "AI pricing", "Trust & compliance", "Autonomous optimization"] as const;

type DemoData = {
  city?: string;
  listings?: readonly { id: string; title: string; city: string }[];
  /** Parsed pricing line for step 2 */
  pricingLine?: string;
  pricingPercent?: string;
  pricingReason?: string;
  /** Trust: static bullets + optional live line */
  trustBullets?: readonly string[];
  trustLiveLine?: string | null;
  /** Step 4 */
  optHeadline?: string;
  optRecommendation?: string;
  optCopy?: string;
};

const DEMO_CAMPAIGN_ID = "00000000-0000-4000-8000-000000000000";

type TrustApiResponse = {
  demandMessage?: string;
  listingCount?: number;
  error?: string;
};

type CityPricingItem = {
  city: string;
  recommendation: string;
  suggestedAdjustmentPercent: number;
  reason: string;
};

export function LiveDemoInteractive() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<DemoData>({});
  const [query, setQuery] = useState("Montreal apartments");
  const [searchTouched, setSearchTouched] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);
  const [typingDone, setTypingDone] = useState(true);
  const playTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedTracked = useRef(false);

  const clearPlayTimers = useCallback(() => {
    for (const t of playTimers.current) clearTimeout(t);
    playTimers.current = [];
  }, []);

  const applyMockForStep2 = useCallback(() => {
    setData((d) => ({
      ...d,
      pricingLine: MOCK_PRICING.headline,
      pricingPercent: MOCK_PRICING.recommendation,
      pricingReason: MOCK_PRICING.reason,
    }));
  }, []);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/market/city-pricing", { cache: "no-store" });
      if (!res.ok) throw new Error("pricing_http");
      const j = (await res.json()) as { recommendations?: CityPricingItem[] };
      const recs = j.recommendations ?? [];
      const mtl =
        recs.find((r) => r.city.toLowerCase().includes("montreal")) ?? recs[0];
      if (mtl) {
        const pct =
          mtl.suggestedAdjustmentPercent > 0
            ? `Increase prices by ${mtl.suggestedAdjustmentPercent}%`
            : mtl.suggestedAdjustmentPercent < 0
              ? `Decrease prices by ${Math.abs(mtl.suggestedAdjustmentPercent)}%`
              : "Keep current pricing";
        const headline =
          mtl.recommendation === "increase_price"
            ? `AI detected high demand in ${mtl.city}`
            : mtl.recommendation === "decrease_price"
              ? `AI suggests reviewing pricing in ${mtl.city}`
              : `AI sees stable demand in ${mtl.city}`;
        setData((d) => ({
          ...d,
          pricingLine: headline,
          pricingPercent: pct,
          pricingReason: mtl.reason,
        }));
      } else {
        applyMockForStep2();
      }
    } catch {
      applyMockForStep2();
    }
  }, [applyMockForStep2]);

  const loadTrust = useCallback(async () => {
    setData((d) => ({ ...d, trustBullets: [...MOCK_TRUST.bullets], trustLiveLine: null }));
    try {
      const res = await fetch(
        `/api/demo/trust-signals?city=${encodeURIComponent(DEMO_CITY)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("trust_http");
      const t = (await res.json()) as TrustApiResponse;
      if (t.demandMessage) {
        setData((d) => ({
          ...d,
          trustBullets: [...MOCK_TRUST.bullets],
          trustLiveLine: t.demandMessage ?? null,
        }));
      }
    } catch {
      // bullets already set
    }
  }, []);

  const loadOptimize = useCallback(async () => {
    setData((d) => ({
      ...d,
      optHeadline: MOCK_OPT.analyzed,
      optRecommendation: `Recommendation: ${MOCK_OPT.recommendation}`,
      optCopy: MOCK_OPT.sampleCopy,
    }));
    try {
      const res = await fetch("/api/marketing/campaign/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: DEMO_CAMPAIGN_ID, dryRun: true }),
      });
      if (!res.ok) throw new Error("opt_http");
      const j = (await res.json()) as {
        insight?: { suggestedAction?: string; reason?: string; recommendation?: string };
        adCopySuggestion?: { body?: string; headline?: string };
      };
      const ins = j.insight;
      if (ins) {
        setData((d) => ({
          ...d,
          optHeadline: "Campaign analyzed",
          optRecommendation: `Recommendation: ${
            ins.suggestedAction ?? ins.recommendation ?? MOCK_OPT.recommendation
          }`,
          optCopy: j.adCopySuggestion?.body ?? j.adCopySuggestion?.headline ?? MOCK_OPT.sampleCopy,
        }));
      }
    } catch {
      // mock already applied
    }
  }, []);

  useEffect(() => {
    if (step < 1 || step > 4) return;
    void trackEvent("demo_step_viewed", { step });
    if (step === 2) void loadPricing();
    if (step === 3) void loadTrust();
    if (step === 4) void loadOptimize();
  }, [step, loadPricing, loadTrust, loadOptimize]);

  useEffect(() => {
    if (step === 2) {
      setTypingDone(false);
      const t = setTimeout(() => setTypingDone(true), 1200);
      return () => clearTimeout(t);
    }
    setTypingDone(true);
    return;
  }, [step, data.pricingLine]);

  useEffect(() => {
    if (step === 4 && !completedTracked.current) {
      completedTracked.current = true;
      void trackEvent("demo_completed", {});
    }
  }, [step]);

  useEffect(() => () => clearPlayTimers(), [clearPlayTimers]);

  const runSearch = () => {
    setSearchTouched(true);
    setData((d) => ({
      ...d,
      city: DEMO_CITY,
      listings: [...MO_LISTINGS],
    }));
    setStep(2);
  };

  const runPlayDemo = () => {
    clearPlayTimers();
    completedTracked.current = false;
    setPlayBusy(true);
    setSearchTouched(true);
    void trackEvent("demo_started", {});

    setData({ city: DEMO_CITY, listings: [...MO_LISTINGS] });
    setStep(1);

    playTimers.current.push(
      setTimeout(() => {
        setStep(2);
        playTimers.current.push(
          setTimeout(() => {
            setStep(3);
            playTimers.current.push(
              setTimeout(() => {
                setStep(4);
                setPlayBusy(false);
              }, 2000)
            );
          }, 2000)
        );
      }, 2000)
    );
  };

  const goNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!searchTouched) {
        runSearch();
      } else {
        setStep(2);
      }
      return;
    }
    if (step < 4) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step <= 0) return;
    if (step === 2) {
      setStep(1);
      return;
    }
    setStep((s) => s - 1);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-4xl font-bold">Live Demo</h1>
        <button
          type="button"
          onClick={runPlayDemo}
          disabled={playBusy}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          <span aria-hidden>▶</span> Run Live Demo
        </button>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Interactive, step-by-step walkthrough. APIs use live data when available; fallbacks keep the
        demo working offline.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium dark:border-neutral-600"
            onClick={goBack}
            disabled={step <= 0}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium dark:border-neutral-600"
            onClick={goNext}
            disabled={step >= 4}
            title="Next"
          >
            Next
          </button>
        </div>
        <p className="text-xs text-neutral-500">Step {step} / 4</p>
      </div>

      <div className="mt-10 space-y-4">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const dim = step === 0 || !active;
          return (
            <motion.section
              key={label}
              layout
              className={cn(
                "overflow-hidden rounded-xl border p-6 transition",
                active
                  ? "border-amber-400/50 bg-amber-50/50 shadow-md dark:border-amber-500/30 dark:bg-amber-950/20"
                  : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/40",
                dim && "opacity-50"
              )}
              style={{ scale: active ? 1.01 : 1 }}
            >
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Step {n}: {label}
              </h2>

              <div className="mt-4">
                {n === 1 && (
                  <div className="space-y-3">
                    {step === 0 ? (
                      <p className="text-sm text-neutral-500">Use <strong>Next</strong> or <strong>Run Live Demo</strong> to start.</p>
                    ) : null}
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400">
                      Try a search (simulated)
                    </label>
                    <input
                      className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={runSearch}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                      >
                        Search
                      </button>
                    </div>
                    {data.listings && step >= 1 ? (
                      <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                        {data.listings.map((l) => (
                          <li key={l.id} className="rounded-md border border-neutral-200/80 p-2 dark:border-neutral-700">
                            {l.title} — {l.city}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}

                {n === 2 && step >= 2 && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: typingDone ? 1 : 0.4, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="space-y-2"
                    >
                      <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {data.pricingLine ?? MOCK_PRICING.headline}
                      </p>
                      <p className="text-amber-800 dark:text-amber-200/90">
                        {data.pricingPercent ?? "Increase prices by 10%"} —{" "}
                        <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                          {data.pricingReason ?? "Demand-based recommendation (simulation)."}
                        </span>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}

                {n === 3 && step >= 3 && (
                  <ul className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                    {(data.trustBullets ?? [...MOCK_TRUST.bullets]).map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <span className="text-emerald-600" aria-hidden>
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                    {data.trustLiveLine ? (
                      <p className="pt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {data.trustLiveLine}
                      </p>
                    ) : null}
                  </ul>
                )}

                {n === 4 && step >= 4 && (
                  <div className="space-y-3 text-sm text-neutral-800 dark:text-neutral-200">
                    <p className="font-medium">{data.optHeadline ?? MOCK_OPT.analyzed}</p>
                    <p>{data.optRecommendation ?? `Recommendation: ${MOCK_OPT.recommendation}`}</p>
                    <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300">
                      {data.optCopy ?? MOCK_OPT.sampleCopy}
                    </div>
                    <Link
                      href="/onboarding"
                      className="mt-2 inline-flex rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
                    >
                      Start using LECIPM
                    </Link>
                  </div>
                )}
              </div>
            </motion.section>
          );
        })}
      </div>
    </main>
  );
}
