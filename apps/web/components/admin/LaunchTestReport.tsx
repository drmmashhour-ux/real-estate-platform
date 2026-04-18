import type { FirstLaunchSimulationReport } from "@/modules/simulation/first-launch-report";

type Props = {
  report: FirstLaunchSimulationReport;
};

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}

export function LaunchTestReport({ report }: Props) {
  const { version, budget, campaignSetup, users, aggregate, recommendations, disclaimer, qaNote } =
    report;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">{version}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Micro-budget model, Google Ads–ready copy, and deterministic 10-user walkthrough with drop-offs — not live
          traffic.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="text-lg font-semibold text-white">$100 CAD micro-flight (strategy)</h2>
        <p className="mt-1 text-xs text-amber-500/90">
          Expected clicks/conversions are modeled from mid CPC + mid CVR — validate in Ads after spend.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Expected clicks</dt>
            <dd className="mt-1 text-2xl font-semibold text-white">{budget.expectedClicks}</dd>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Expected conversions (modeled)</dt>
            <dd className="mt-1 text-2xl font-semibold text-white">{budget.expectedConversions}</dd>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Revenue proxy (CAD)</dt>
            <dd className="mt-1 text-2xl font-semibold text-emerald-400/90">${budget.expectedRevenueCad}</dd>
          </div>
        </dl>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-3 font-medium">Campaign</th>
                <th className="py-2 pr-3 font-medium">Budget</th>
                <th className="py-2 pr-3 font-medium">CPC (mid)</th>
                <th className="py-2 pr-3 font-medium">Clicks</th>
                <th className="py-2 pr-3 font-medium">Conv (mid CVR)</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {budget.campaigns.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-medium text-white">{c.name}</td>
                  <td className="py-2 pr-3">${c.budgetCad}</td>
                  <td className="py-2 pr-3">${c.cpcMidCad}</td>
                  <td className="py-2 pr-3">{c.expectedClicks}</td>
                  <td className="py-2 pr-3">{c.expectedConversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-inside list-disc text-xs text-zinc-500">
          {budget.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="text-lg font-semibold text-white">Campaign setup (Google Ads–ready)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {campaignSetup.flightName} · {campaignSetup.geo} · {campaignSetup.language}
        </p>
        <div className="mt-4 space-y-4">
          {campaignSetup.campaigns.map((camp) => (
            <details key={camp.id} className="group rounded-xl border border-zinc-800 bg-zinc-900/30 open:bg-zinc-900/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-zinc-500">▸</span>
                {camp.name}{" "}
                <span className="ml-2 text-xs font-normal text-zinc-500">({camp.objective})</span>
              </summary>
              <div className="border-t border-zinc-800 px-4 pb-4 pt-2 text-sm">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ad groups</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {camp.adGroups.map((ag) => (
                        <li key={ag.id} className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-2">
                          <div className="font-medium text-white">{ag.name}</div>
                          <div className="text-xs text-zinc-500">
                            Landing: <code className="text-zinc-400">{ag.landingPath}</code> · UTM:{" "}
                            {ag.utmCampaign}
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">{ag.keywords.join(" · ")}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Headlines</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-300">
                      {camp.headlines.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ol>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Descriptions
                    </h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-300">
                      {camp.descriptions.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="text-lg font-semibold text-white">Funnel (simulated 10 users)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500">
                <th className="py-2 pr-3 font-medium">Step</th>
                <th className="py-2 pr-3 font-medium">Reached</th>
                <th className="py-2 pr-3 font-medium">From previous</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {aggregate.funnel.map((row) => (
                <tr key={row.step} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-mono text-xs text-white">{row.step}</td>
                  <td className="py-2 pr-3">{row.reached}</td>
                  <td className="py-2 pr-3">{pct(row.rateFromPrevious)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Conversions</dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              {aggregate.conversions} / {aggregate.totalUsers}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Conversion rate</dt>
            <dd className="mt-1 text-xl font-semibold text-emerald-400/90">
              {Math.round(aggregate.conversionRate * 1000) / 10}%
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Revenue estimate (CAD)</dt>
            <dd className="mt-1 text-xl font-semibold text-zinc-200">${aggregate.revenueEstimateCad}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
          <h2 className="text-lg font-semibold text-white">Drop-off reasons (non-converters)</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {aggregate.dropOffPoints.length === 0 ? (
              <li className="text-zinc-500">None recorded.</li>
            ) : (
              aggregate.dropOffPoints.map((d) => (
                <li key={d.step} className="flex justify-between gap-2 border-b border-zinc-800/60 pb-2">
                  <span>{d.step}</span>
                  <span className="text-zinc-500">×{d.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
          <h2 className="text-lg font-semibold text-white">Friction signals (aggregated)</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {aggregate.frictionPoints.map((f) => (
              <li key={f.label} className="flex justify-between gap-2 border-b border-zinc-800/60 pb-2">
                <span>{f.label}</span>
                <span className="text-amber-400/90">×{f.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="text-lg font-semibold text-white">Ten user simulations</h2>
        <div className="mt-4 space-y-3">
          {users.map((u) => (
            <details
              key={u.userId}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 open:bg-zinc-900/45"
            >
              <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500">{u.userId}</span>
                  <span className="font-medium text-white">{u.personaLabel}</span>
                  <span
                    className={
                      u.conversion
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400"
                        : "rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400"
                    }
                  >
                    {u.conversion ? "Converted" : "No conversion"}
                  </span>
                </div>
              </summary>
              <div className="border-t border-zinc-800 px-4 pb-4 pt-2 text-sm">
                <ol className="list-decimal space-y-1 pl-5 text-zinc-300">
                  {u.steps.map((s, i) => (
                    <li key={i}>
                      <span className="font-mono text-xs text-white">{s.step}</span>{" "}
                      <span className="text-zinc-500">({s.outcome})</span>
                      {s.detail ? <span className="text-zinc-400"> — {s.detail}</span> : null}
                    </li>
                  ))}
                </ol>
                {u.friction.length > 0 ? (
                  <p className="mt-2 text-xs text-amber-400/90">Friction: {u.friction.join("; ")}</p>
                ) : null}
                {u.dropOffReason ? (
                  <p className="mt-1 text-xs text-red-400/90">Drop-off: {u.dropOffReason}</p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="text-lg font-semibold text-white">Optimization recommendations</h2>
        <ul className="mt-4 space-y-3">
          {recommendations.map((r, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-400">
                  {r.category}
                </span>
                <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
                  {r.priority}
                </span>
                <span className="font-medium text-white">{r.title}</span>
              </div>
              <p className="mt-2 text-zinc-400">{r.rationale}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
        <h2 className="text-sm font-semibold text-red-300">QA &amp; honesty</h2>
        <p className="mt-2 text-sm text-zinc-400">{disclaimer}</p>
        <p className="mt-2 text-sm text-red-300/90">{qaNote}</p>
      </section>
    </div>
  );
}
