"use client";

import type { ProductInsightsEngineSnapshot } from "@/lib/insights/product-insights-engine";

function MiniBars({
  title,
  subtitle,
  series,
  colorClass,
}: {
  title: string;
  subtitle: string;
  series: Array<{ day: string; count: number }>;
  colorClass: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const barMaxPx = 112;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">{title}</p>
      <p className="mt-1 text-xs text-[#737373]">{subtitle}</p>
      <div className="mt-4 flex h-32 items-end gap-0.5 sm:gap-1">
        {series.map((s) => (
          <div key={s.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div
              className={`w-full max-w-[14px] rounded-t ${colorClass} transition-opacity`}
              style={{ height: `${Math.max(4, (s.count / max) * barMaxPx)}px` }}
              title={`${s.day}: ${s.count}`}
            />
            <span className="hidden text-[9px] text-[#737373] sm:block">
              {s.day.slice(5).replace("-", "/")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-[#111111] to-[#0B0B0B] p-5 shadow-lg shadow-black/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[#737373]">{hint}</p> : null}
    </div>
  );
}

export function InsightsDashboard({ data }: { data: ProductInsightsEngineSnapshot }) {
  const analyzeToSave =
    data.analyzeToSaveRate != null ? `${data.analyzeToSaveRate}%` : "—";
  const eventFunnel =
    data.eventFunnelConversionPct != null ? `${data.eventFunnelConversionPct}%` : "—";
  const f = data.funnel30d;
  const g = data.growth30d;
  const microTotal = f.microFeedbackYes + f.microFeedbackNo;
  const microPct =
    microTotal > 0 ? `${Math.round((f.microFeedbackYes / microTotal) * 100)}% thumbs-up` : "—";

  return (
    <div className="space-y-10">
      <p className="text-sm text-[#B3B3B3]">
        Built from <strong className="text-white">UserEvent</strong>,{" "}
        <strong className="text-white">UserFeedback</strong>,{" "}
        <strong className="text-white">TrafficEvent</strong> (funnel steps), and{" "}
        <strong className="text-white">InvestmentDeal</strong> — no third-party analytics.
      </p>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Live funnel (last {f.days} days, traffic)
        </p>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Visits → Analyze CTA → Run analysis → Save → Dashboard. Highlights where users stop.
        </p>
        {f.biggestDropPct != null && f.biggestDropLabel ? (
          <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm font-medium text-amber-100">
            <span className="text-amber-400">Biggest drop-off:</span> {f.biggestDropLabel} —{" "}
            <strong className="text-white">{f.biggestDropPct}%</strong> relative loss between stages
          </p>
        ) : (
          <p className="mt-3 text-xs text-[#737373]">Need more traffic events to compute drop-offs.</p>
        )}
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Home visits (sessions)</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{f.homeSessions.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Analyze CTA clicks</dt>
            <dd className="mt-1 text-xl font-semibold text-emerald-300">{f.analyzeCtaClicks.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Run analysis</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{f.analyzeRuns.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Saves (traffic)</dt>
            <dd className="mt-1 text-xl font-semibold text-amber-200">{f.saves.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Dashboard visits</dt>
            <dd className="mt-1 text-xl font-semibold text-sky-200">{f.dashboardVisits.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[#737373]">
          Micro-feedback (Was this helpful?): <strong className="text-white">{f.microFeedbackYes}</strong> yes ·{" "}
          <strong className="text-white">{f.microFeedbackNo}</strong> no
          {microTotal > 0 ? <span className="text-[#737373]"> · {microPct}</span> : null}
        </p>
      </section>

      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Growth &amp; sharing (last {g.days} days)
        </p>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Share clicks, copy actions, recorded visits to public deal pages, and analyze runs attributed to{" "}
          <code className="text-violet-200/90">utm_source=share</code>.
        </p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Share (native/clipboard)</dt>
            <dd className="mt-1 text-xl font-semibold text-violet-200">{g.shareDealClicks.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Copy after analysis</dt>
            <dd className="mt-1 text-xl font-semibold text-violet-200">{g.shareCopyAfterAnalysis.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Shared page visits (DB)</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{g.sharedDealPageVisitsRecorded.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Visits w/ ref (deal or user)</dt>
            <dd className="mt-1 text-xl font-semibold text-emerald-200/90">{g.sharedDealVisitsWithReferrer.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Analyze from share UTM</dt>
            <dd className="mt-1 text-xl font-semibold text-amber-200/90">
              {g.analyzeRunsFromShareAttribution.toLocaleString()}
            </dd>
          </div>
        </dl>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Free plan limit hit (traffic)</dt>
            <dd className="mt-1 text-xl font-semibold text-rose-200/90">{g.planLimitHits.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#737373]">Upgrade clicks</dt>
            <dd className="mt-1 text-xl font-semibold text-emerald-200/90">{g.upgradeClicks.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#737373]">
          <strong className="text-white">Total users (all time):</strong> {data.totalUsers.toLocaleString()} — combine with
          funnels above for acquisition.
        </p>
      </section>

      {data.automatedInsights.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-950/25 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">What to fix next</p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-amber-100/95">
            {data.automatedInsights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 px-5 py-4 text-sm text-emerald-100/90">
          No automated alerts right now — thresholds need more usage data (e.g. ≥5 analyze events) or metrics look
          healthy.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Total users" value={data.totalUsers.toLocaleString()} />
        <MetricCard
          title="Total analyses (events)"
          value={data.totalAnalyses.toLocaleString()}
          hint="UserEvent ANALYZE — all time"
        />
        <MetricCard
          title="Total saved deals (DB)"
          value={data.totalSavedDeals.toLocaleString()}
          hint="InvestmentDeal rows"
        />
        <MetricCard
          title="Conversion (analyze → save)"
          value={analyzeToSave}
          hint="savedDeals ÷ analyses — InvestmentDeal rows ÷ ANALYZE events"
        />
        <MetricCard
          title="Event funnel (save / analyze)"
          value={eventFunnel}
          hint="SAVE_DEAL events ÷ ANALYZE events (includes demo)"
        />
        <MetricCard
          title="Avg deals / user"
          value={data.avgDealsPerUser}
          hint="InvestmentDeal count ÷ registered users"
        />
        <MetricCard title="Feedback count" value={data.feedbackCount.toLocaleString()} />
        <MetricCard
          title="Server-tracked analyses"
          value={data.serverTrackedAnalyses.toLocaleString()}
          hint="Sum of investment_mvp_analyze_count"
        />
        <MetricCard title="Save events (traffic)" value={data.totalSaveEvents.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MiniBars
          title="Analyses per day"
          subtitle={`Last ${data.chartDays} days (UserEvent ANALYZE)`}
          series={data.charts.analysesPerDay}
          colorClass="bg-emerald-500/80"
        />
        <MiniBars
          title="Saves per day"
          subtitle={`Last ${data.chartDays} days (InvestmentDeal)`}
          series={data.charts.savesPerDay}
          colorClass="bg-amber-500/75"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-white">Top actions (product features)</h2>
          <p className="mt-1 text-xs text-[#737373]">From UserEvent — Analyze, Save deal, Compare (all time)</p>
          <dl className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#737373]">Most used</dt>
              <dd className="font-medium text-emerald-300">{data.mostUsedFeature ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#737373]">Least used</dt>
              <dd className="font-medium text-amber-200/90">{data.leastUsedFeature ?? "—"}</dd>
            </div>
            {Object.entries(data.featureCounts).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-white/5 pt-2 text-[#B3B3B3]">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Most active users</h2>
          <p className="mt-1 text-xs text-[#737373]">By server analyze count, then saved deals</p>
          <ul className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {data.mostActiveUsers.length === 0 ? (
              <li className="text-sm text-[#737373]">No data yet.</li>
            ) : (
              data.mostActiveUsers.map((u) => (
                <li
                  key={u.email}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-[#B3B3B3]">{u.email}</span>
                  <span className="text-xs text-[#737373]">
                    analyses <strong className="text-white">{u.investmentMvpAnalyzeCount}</strong> · saves{" "}
                    <strong className="text-white">{u.savedDeals}</strong>
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white">Recent feedback</h2>
        <p className="mt-1 text-xs text-[#737373]">UserFeedback — latest 20</p>
        <ul className="mt-4 space-y-3">
          {data.recentFeedback.length === 0 ? (
            <li className="text-sm text-[#737373]">No feedback yet.</li>
          ) : (
            data.recentFeedback.map((f) => (
              <li key={f.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
                  <time dateTime={f.createdAt}>{new Date(f.createdAt).toLocaleString()}</time>
                  {f.rating != null ? <span className="text-amber-400/90">Rating: {f.rating}/5</span> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[#B3B3B3]">{f.message}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
