import { adsStrategyFlags } from "@/config/feature-flags";
import { buildLaunchAdsStrategy, buildScalePlan } from "@/modules/ads/ads-strategy.service";
import { buildGoogleAdsManagerGuide, buildMetaAdsManagerGuide } from "@/modules/ads/ads-manager-guide.service";
import { listFacebookCampaignPacks } from "@/modules/ads/facebook-campaign-packs.service";
import { listGoogleCampaignPacks } from "@/modules/ads/google-campaign-packs.service";
import { listLandingOptimizationPacks } from "@/modules/ads/landing-optimization-pack.service";
import { buildFirst100UsersOperatingPlan } from "@/modules/launch/first-100-users-plan.service";
import { buildScalingPlanDocument } from "@/modules/launch/scaling-plan.service";

/**
 * Server-rendered growth playbook — gated by FEATURE_ADS_STRATEGY_V1 / SCALE / FIRST_100 plan flags.
 */
export async function GrowthAdsStrategyPlaybook({ city = "Montréal" }: { city?: string }) {
  const c = city.trim() || "Montréal";
  const { adsStrategyV1, scalePlanV1, first100UsersPlanV1 } = adsStrategyFlags;
  if (!adsStrategyV1 && !scalePlanV1 && !first100UsersPlanV1) return null;

  const launch = adsStrategyV1 ? buildLaunchAdsStrategy(c) : null;
  const scale = scalePlanV1 ? buildScalingPlanDocument() : null;
  const first100 = first100UsersPlanV1 ? buildFirst100UsersOperatingPlan(c) : null;
  const fbPacks = adsStrategyV1 ? listFacebookCampaignPacks(c) : [];
  const glPacks = adsStrategyV1 ? listGoogleCampaignPacks(c) : [];
  const landOpt = adsStrategyV1 ? listLandingOptimizationPacks(c) : [];
  const metaGuide = adsStrategyV1 ? buildMetaAdsManagerGuide(c) : null;
  const googleGuide = adsStrategyV1 ? buildGoogleAdsManagerGuide(c) : null;
  const scaleOnly = scalePlanV1 && !adsStrategyV1 ? buildScalePlan() : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <h2 className="text-sm font-semibold text-amber-100">LECIPM Ads Strategy + Scale Plan v1</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Planning and copy exports only — no Meta/Google API keys, no auto-spend. Enable{" "}
          <code className="text-zinc-400">FEATURE_ADS_STRATEGY_V1</code>,{" "}
          <code className="text-zinc-400">FEATURE_SCALE_PLAN_V1</code>,{" "}
          <code className="text-zinc-400">FEATURE_FIRST_100_USERS_PLAN_V1</code> to show sections below.
        </p>
      </div>

      {launch ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Launch ads strategy</h3>
          <p className="mt-2 text-xs text-zinc-500">Best channels → KPIs; budgets are suggested caps for humans in Ads Manager.</p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-300">
            {launch.bestChannels.map((ch) => (
              <li key={ch.id}>
                <span className="font-medium text-zinc-200">{ch.name}</span> (P{ch.priority}) — {ch.rationale}
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800/80 bg-black/20 p-3 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">Daily budget (CAD, test)</p>
              <p>
                ${launch.dailyBudgetsCad.testMin}–${launch.dailyBudgetsCad.testMax} · {launch.dailyBudgetsCad.optimizeBand}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-black/20 p-3 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">KPIs</p>
              <ul className="mt-1 list-inside list-disc">
                {launch.kpisToWatch.slice(0, 4).map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {scale ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Scaling plan</h3>
          <p className="mt-1 text-xs text-zinc-500">{scale.summary}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs text-zinc-300">
              <p className="font-semibold text-emerald-200">{scale.plan.phase_1_test.label}</p>
              <p className="mt-1 text-zinc-400">{scale.plan.phase_1_test.dailyBudgetCadRange}</p>
              <p className="mt-2">{scale.plan.phase_1_test.focus}</p>
            </div>
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs text-zinc-300">
              <p className="font-semibold text-emerald-200">{scale.plan.phase_2_optimize.label}</p>
              <p className="mt-1 text-zinc-400">{scale.plan.phase_2_optimize.dailyBudgetCadRange}</p>
              <p className="mt-2">{scale.plan.phase_2_optimize.focus}</p>
            </div>
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs text-zinc-300">
              <p className="font-semibold text-emerald-200">{scale.plan.phase_3_scale.label}</p>
              <p className="mt-1 text-zinc-400">{scale.plan.phase_3_scale.dailyBudgetCadRange}</p>
              <p className="mt-2">{scale.plan.phase_3_scale.focus}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stop rules</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                {scale.plan.stopRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scale rules</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                {scale.plan.scaleRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : scaleOnly ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Scaling plan (summary)</h3>
          <p className="mt-1 text-xs text-zinc-500">Full launch strategy card is hidden — enable FEATURE_ADS_STRATEGY_V1 for channels + packs.</p>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
            {scaleOnly.stopRules.slice(0, 3).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {first100 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">First 100 users (operating plan)</h3>
          <p className="mt-1 text-xs text-zinc-500">Segment quotas + scripts — humans send all messages.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {first100.segments.map((s) => (
              <span key={s.id} className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-xs text-zinc-300">
                {s.id}: <strong className="text-zinc-100">{s.targetUsers}</strong>
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-zinc-500">Daily checklist</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                {first100.dailyChecklist.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500">Launch offers (non-cash)</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                {first100.launchOffers.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {fbPacks.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Meta campaign packs</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {fbPacks.map((p) => (
              <div key={p.id} className="rounded-lg border border-zinc-800/90 bg-black/20 p-3 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-200">{p.label}</p>
                <p className="mt-1">
                  Objective: <code className="text-zinc-500">{p.objective}</code> · CTA: {p.cta}
                </p>
                <p className="mt-1">
                  Landing: <code className="break-all text-emerald-500/90">{p.landingPath}</code>
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">Headlines: {p.headlines.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {glPacks.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Google Ads campaign packs</h3>
          <div className="mt-3 space-y-3">
            {glPacks.map((p) => (
              <div key={p.id} className="rounded-lg border border-zinc-800/90 bg-black/20 p-3 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-200">{p.campaignName}</p>
                <p className="mt-1">
                  Negatives: {p.negativeKeywords.join(", ")}
                </p>
                <p className="mt-1">
                  Landing: <code className="break-all text-emerald-500/90">{p.landingPath}</code>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {landOpt.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Landing optimization suggestions</h3>
          <p className="mt-1 text-xs text-zinc-500">Optional A/B copy — core landings unchanged unless you wire these in product.</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {landOpt.map((o) => (
              <li key={o.type} className="rounded border border-zinc-800/80 bg-black/20 p-2">
                <span className="font-semibold text-zinc-200">{o.type}</span> — {o.headlineAlt}{" "}
                <span className="text-zinc-500">(CTA alt: {o.primaryCtaAlt})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {metaGuide && googleGuide ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Ads Manager guides</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">{metaGuide.title}</p>
              <ul className="mt-2 list-inside list-disc">
                {metaGuide.avoid.map((x) => (
                  <li key={x}>Avoid: {x}</li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">{googleGuide.title}</p>
              <ul className="mt-2 list-inside list-disc">
                {googleGuide.avoid.map((x) => (
                  <li key={x}>Avoid: {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
