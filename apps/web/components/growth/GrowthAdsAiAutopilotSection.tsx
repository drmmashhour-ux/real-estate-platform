import { adsAiAutomationFlags } from "@/config/feature-flags";
import { analyzePerformanceAndImprove } from "@/modules/ads/ads-ai-optimizer.service";
import { generateCampaignStructure } from "@/modules/ads/ads-campaign-ai.service";
import { generateAdCopy, generateVideoScript } from "@/modules/ads/ads-creative-ai.service";
import { getAdsLearningStore } from "@/modules/ads/ads-learning-store";
import { listAdsAiAutopilotRecommendations } from "@/modules/ads/ads-ai-autopilot-bridge";
import { getAdsPerformanceSummary } from "@/modules/ads/ads-performance.service";

export async function GrowthAdsAiAutopilotSection() {
  if (!adsAiAutomationFlags.aiAdsAutopilotV1) {
    return null;
  }

  const campaign = generateCampaignStructure({
    platform: "meta",
    objective: "lead",
    city: "Montréal",
    audience: "Travel + relocation intent",
  });

  const altCopy = generateAdCopy({
    platform: "google",
    objective: "booking",
    city: "Montréal",
    audience: "Short-term rental searchers",
  });

  const video = generateVideoScript({
    city: "Montréal",
    objective: "booking",
    audience: "Weekend travellers",
    product: "bnhub",
  });

  const perf = await getAdsPerformanceSummary(14, { estimatedSpend: 0 });
  const optimization = analyzePerformanceAndImprove({
    ctrPercent: perf.ctrPercent,
    cpl: perf.cpl,
    conversionRatePercent: perf.conversionRatePercent,
  });

  const learning = getAdsLearningStore();
  const autopilot = listAdsAiAutopilotRecommendations();

  return (
    <section className="rounded-2xl border border-fuchsia-900/35 bg-fuchsia-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400/90">AI Ads Autopilot</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Generate · recommend · optimize</h2>
        </div>
        <p className="max-w-md text-xs text-zinc-500">
          No Meta/Google API · no auto-spend · paste creatives into Ads Manager yourself.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Generated campaign</h3>
          <p className="mt-2 text-xs text-zinc-500">Name</p>
          <p className="text-sm text-fuchsia-200/90">{campaign.campaignName}</p>
          <p className="mt-3 text-xs text-zinc-500">Objective</p>
          <p className="text-sm text-zinc-300">{campaign.objective}</p>
          <p className="mt-3 text-xs text-zinc-500">Targeting hints</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-400">
            {campaign.audienceTargeting.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">Budget (initial plan)</p>
          <ul className="mt-1 text-xs text-zinc-400">
            <li>Days 1–5: {campaign.budgetSuggestion.day1to5}</li>
            <li>Days 6–10: {campaign.budgetSuggestion.day6to10}</li>
            <li>Day 10+: {campaign.budgetSuggestion.day10plus}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Creatives (Meta sample)</h3>
          <p className="mt-1 text-xs text-zinc-500">Primary texts</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-300">
            {campaign.creatives.primaryTexts.map((t, i) => (
              <li key={i} className="rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1 whitespace-pre-wrap">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">Headlines</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-300">
            {campaign.creatives.headlines.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            CTA: <span className="text-fuchsia-200/90">{campaign.creatives.cta}</span>
          </p>

          <h4 className="mt-4 text-xs font-semibold text-zinc-400">Alt: Google / booking</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-500">
            {altCopy.headlines.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Video script (template)</h3>
        <dl className="mt-3 space-y-2 text-xs text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-300">Hook</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{video.hook}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-300">Body</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{video.body}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-300">CTA</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{video.cta}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-300">Scenes</dt>
            <dd>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {video.sceneSuggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-amber-900/35 bg-amber-950/15 p-4">
        <h3 className="text-sm font-semibold text-amber-100/90">Optimization (from live KPIs)</h3>
        <p className="mt-1 text-xs text-zinc-500">{optimization.summary}</p>
        <p className="mt-2 text-xs font-semibold text-zinc-300">
          Recommendation: <span className="text-amber-200/90">{optimization.recommendation}</span>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-500">Improved headlines</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-400">
              {optimization.improvedHeadlines.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Targeting tweaks</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-400">
              {optimization.improvedTargeting.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/60 p-3 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-200">Learning store (in-memory)</p>
          <p className="mt-1">Winning headlines: {learning.winningHeadlines.length}</p>
          <p>Losing headlines: {learning.losingHeadlines.length}</p>
          <p>Audiences: {learning.bestAudiences.length}</p>
          <p>Hooks ±: {learning.highPerformingHooks.length} / {learning.lowPerformingHooks.length}</p>
          <p>CTAs ±: {learning.bestCtaPhrases.length} / {learning.weakCtaPhrases.length}</p>
          <p className="mt-2 text-zinc-500">Biases template generation on the server — resets on deploy.</p>
        </div>
        <div className="rounded-xl border border-zinc-800/60 p-3">
          <p className="text-xs font-semibold text-zinc-200">Autopilot actions (recommendation-only)</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {autopilot.map((a) => (
              <li key={a.actionType}>
                <span className="text-fuchsia-300/90">{a.title}</span> — {a.summary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
