import Link from "next/link";
import {
  engineFlags,
  abTestingFlags,
  croRetargetingDurabilityFlags,
  croRetargetingLearningFlags,
  negativeSignalQualityFlags,
} from "@/config/feature-flags";
import { analyzeBookingFunnel } from "@/modules/growth/booking-funnel-analysis.service";
import { buildAutomatedCroRecommendations } from "@/modules/cro/cro-recommendations";
import { listExperiments } from "@/modules/experiments/ab-experiment.service";
import {
  buildUnifiedSnapshot,
  loadPersistentCroRetargetingLearning,
} from "@/modules/growth/unified-learning.service";
import { evaluateCTA, evaluateTrustImpact, evaluateUrgencyImpact } from "@/modules/cro/cro-performance.service";
import { getDurabilityHealth } from "@/modules/growth/cro-retargeting-durability.repository";
import { detectCroLowConversion } from "@/modules/growth/negative-signal-quality.service";

const WINDOW_DAYS = 7;

export async function GrowthConversionOptimizationSection({
  locale,
  country,
}: {
  locale: string;
  country: string;
}) {
  const funnel = await analyzeBookingFunnel(WINDOW_DAYS);
  const recs = buildAutomatedCroRecommendations(funnel);
  const adminExperimentsBase = `/${locale}/${country}/admin`;

  const running = abTestingFlags.abTestingV1 ? await listExperiments({ status: ["running"] }) : [];

  const c = funnel.counts;
  const cro = funnel.croEngineHints;

  if (croRetargetingDurabilityFlags.croRetargetingDurabilityV1 || croRetargetingLearningFlags.croRetargetingPersistenceV1) {
    await loadPersistentCroRetargetingLearning().catch(() => {});
  }
  const unified = buildUnifiedSnapshot();
  const topCta = unified.bestCtas[0];
  const weakCta = unified.weakCtas[0];
  const [ctaEval, trustEval, urgencyEval, durHealth, croLowRows] = await Promise.all([
    topCta ? evaluateCTA(topCta) : Promise.resolve(null),
    evaluateTrustImpact("verified_listing"),
    evaluateUrgencyImpact("views_today"),
    getDurabilityHealth().catch(() => null),
    negativeSignalQualityFlags.negativeSignalQualityV1 ? detectCroLowConversion(WINDOW_DAYS).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <section
      className="rounded-2xl border border-rose-900/35 bg-rose-950/10 p-5 sm:p-6"
      data-growth-cro-section
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300/90">LECIPM CRO Engine</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Conversion Optimization</h2>
        </div>
        {!engineFlags.croEngineV1 ? (
          <p className="max-w-md text-xs text-zinc-500">
            Enable <code className="rounded bg-zinc-800 px-1">FEATURE_CRO_ENGINE_V1=true</code> for on-site trust/urgency
            treatments and rotation. Funnel data below is always from stored events.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">UX + analytics only — no Stripe core changes</p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-zinc-800/60 bg-black/25 px-3 py-2">
        <p className="text-xs font-medium text-zinc-500">Bottleneck stage</p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">{funnel.bottleneck}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/20 px-3 py-2" data-growth-cro-metric="listing_to_checkout">
          <p className="text-xs font-medium text-zinc-500">Listing → checkout %</p>
          <p className="mt-1 text-sm text-zinc-200">
            {c.listingViews} views → {c.bookingStarted} starts{" "}
            <span className="text-zinc-500">
              (
              {funnel.rates.listingToCheckoutPercent != null
                ? `${funnel.rates.listingToCheckoutPercent}%`
                : "—"}
              )
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-black/20 px-3 py-2" data-growth-cro-metric="checkout_to_payment">
          <p className="text-xs font-medium text-zinc-500">Checkout → payment %</p>
          <p className="mt-1 text-sm text-zinc-200">
            {c.bookingStarted} starts → {c.bookingCompleted} completed{" "}
            <span className="text-zinc-500">
              (
              {funnel.rates.checkoutToPaidPercent != null ? `${funnel.rates.checkoutToPaidPercent}%` : "—"})
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-900/30 bg-amber-950/15 px-3 py-2">
        <p className="text-xs font-semibold text-amber-200/90">Drop-off signal</p>
        <p className="mt-1 text-sm text-zinc-200">
          <span className="font-medium text-amber-100/95">{cro.dominantIssue}</span>
          <span className="text-zinc-500"> — </span>
          {cro.reason}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Legacy bottleneck: <span className="text-zinc-400">{funnel.bottleneck}</span> · {funnel.recommendation}
        </p>
      </div>

      {durHealth ? (
        <div className="mt-4 rounded-lg border border-cyan-900/35 bg-cyan-950/15 px-3 py-2 text-xs text-zinc-400">
          <span className="font-semibold text-cyan-200/90">Durability health: </span>
          CRO signals (14d): {durHealth.croSignalRows14d} · Retargeting signals: {durHealth.retargetingSignalRows14d} ·
          Low-conv snapshots: CRO {durHealth.croLowSnapshots} / RT {durHealth.retargetingLowSnapshots} · Perf rows:{" "}
          {durHealth.performanceSnapshots}
        </div>
      ) : null}

      {croLowRows.length > 0 && negativeSignalQualityFlags.negativeSignalQualityV1 ? (
        <div className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/15 px-3 py-2 text-xs text-zinc-400">
          <p className="font-semibold text-amber-200/90">Low-conversion detection (conservative)</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {croLowRows.slice(0, 4).map((row) => (
              <li key={row.entityId}>
                {row.signalType} · {row.evidenceQuality} · {row.reasons[0] ?? "—"}
                {row.warnings.length ? <span className="text-zinc-600"> — {row.warnings[0]}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-emerald-900/35 bg-emerald-950/10 p-4">
        <p className="text-sm font-semibold text-emerald-200/90">Performance insights (unified learning)</p>
        <p className="mt-1 text-xs text-zinc-500">
          Fused from real growth_events signals + ads memory when present. AB &gt; CRO &gt; Ads &gt; Retargeting.
        </p>
        <dl className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Best CTA (hint)</dt>
            <dd className="text-zinc-200">{topCta ?? "—"}</dd>
            {ctaEval ? (
              <dd className="mt-1 text-[10px] text-zinc-600">
                {ctaEval.sourceLabel ?? "HEURISTIC"} · conf {(ctaEval.confidence * 100).toFixed(0)}% · evidence{" "}
                {(ctaEval.evidenceScore * 100).toFixed(0)}%
                {ctaEval.evidenceQuality ? ` · quality ${ctaEval.evidenceQuality}` : ""}
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-zinc-500">Weak CTA (avoid)</dt>
            <dd className="text-zinc-200">{weakCta ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Trust impact (proxy)</dt>
            <dd className="text-zinc-200">
              {trustEval.sourceLabel ?? "—"} · conf {(trustEval.confidence * 100).toFixed(0)}% · evidence{" "}
              {(trustEval.evidenceScore * 100).toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Urgency impact (proxy)</dt>
            <dd className="text-zinc-200">
              {urgencyEval.sourceLabel ?? "—"} · conf {(urgencyEval.confidence * 100).toFixed(0)}% · evidence{" "}
              {(urgencyEval.evidenceScore * 100).toFixed(0)}%
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-zinc-400">Automated recommendations</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {recs.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-200">Active A/B tests (CRO-related)</p>
          {!abTestingFlags.abTestingV1 ? (
            <span className="text-xs text-zinc-500">Enable FEATURE_AB_TESTING_V1</span>
          ) : (
            <Link href={`${adminExperimentsBase}/experiments`} className="text-xs text-rose-300/90 hover:underline">
              Open experiments
            </Link>
          )}
        </div>
        {abTestingFlags.abTestingV1 ? (
          running.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">No running experiments.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              {running.slice(0, 8).map((e) => (
                <li key={e.id} className="rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1">
                  <span className="font-medium text-zinc-200">{e.name}</span>
                  <span className="block text-zinc-500">Surface: {e.targetSurface}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            Enable <code className="rounded bg-zinc-800 px-1">FEATURE_AB_TESTING_V1</code> to list live tests (CTA,
            trust line, reassurance).
          </p>
        )}
      </div>
    </section>
  );
}
