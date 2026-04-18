import {
  buildLiveAdsLaunchGuide,
  getInitialBudgetPlan,
  getLiveCampaignDefinitions,
  getLiveSpendRules,
  LIVE_ADS_TRACKING_CONFIRMATION,
} from "@/modules/ads";

export function GrowthAdsLaunchSection({ locale, country }: { locale: string; country: string }) {
  const campaigns = getLiveCampaignDefinitions();
  const budget = getInitialBudgetPlan();
  const rules = getLiveSpendRules();
  const guide = buildLiveAdsLaunchGuide(locale, country);
  const base = `/${locale}/${country}`;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/90">Ads Launch</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Paid social + search (manual setup)</h2>
        </div>
        <p className="text-xs text-zinc-500">No API spend · ops pastes copy in Meta / Google UIs</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Campaigns ready</h3>
          <ul className="mt-3 space-y-3 text-sm text-zinc-400">
            {campaigns.map((c) => (
              <li key={c.id} className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2">
                <p className="font-medium text-zinc-200">{c.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Landing:{" "}
                  <code className="text-emerald-400/90">
                    {base}
                    {c.landingPath}
                  </code>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Budget plan (initial)</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>
              Days 1–5: <span className="text-zinc-200">{budget.day1to5}</span>
            </li>
            <li>
              Days 6–10: <span className="text-zinc-200">{budget.day6to10}</span>
            </li>
            <li>
              Day 10+: <span className="text-zinc-200">{budget.day10plus}</span>
            </li>
          </ul>

          <h3 className="mt-6 text-sm font-semibold text-zinc-200">Scale / kill rules</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            {rules.kill.map((r) => (
              <li key={r}>
                <span className="text-red-400/90">Kill:</span> {r}
              </li>
            ))}
            {rules.scale.map((r) => (
              <li key={r}>
                <span className="text-emerald-400/90">Scale:</span> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Launch checklist (high level)</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
          <li>QA each landing with UTMs on mobile — trust line + CTA above the fold.</li>
          <li>Meta: paused campaign → placements Feed + Stories → enable after preview.</li>
          <li>Google: Search → phrase/exact first → expand from Search Terms.</li>
          <li>Watch CTR, CPC, and CRM leads attributed to paid (not just clicks).</li>
        </ol>
        <p className="mt-2 text-xs text-zinc-500">{guide.utmReminder}</p>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-200">Metrics to watch</h3>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-zinc-700 px-2 py-0.5">CTR (ad / LP)</span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5">CPC / CPM</span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5">Lead form submits</span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5">Cost per lead</span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5">Booking & revenue (downstream)</span>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Public ads beacon: {LIVE_ADS_TRACKING_CONFIRMATION.publicFunnelSteps.join(", ")} — see{" "}
          <code className="text-zinc-400">LIVE_ADS_TRACKING_CONFIRMATION</code> for booking/payment routing.
        </p>
      </div>
    </section>
  );
}
