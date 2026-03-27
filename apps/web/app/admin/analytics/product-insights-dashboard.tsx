"use client";

import type { ProductInsightsPayload } from "@/modules/analytics/services/product-insights-queries";

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#C9A646]/25 bg-gradient-to-br from-[#111111] to-[#0B0B0B] p-5 shadow-lg shadow-black/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {subtitle ? <p className="mt-2 text-xs text-[#B3B3B3]">{subtitle}</p> : null}
    </div>
  );
}

export function ProductInsightsDashboard({ data }: { data: ProductInsightsPayload }) {
  const { days, approxUsers, counts, growth, mostUsedFeature, feedback, wordHighlights, insights } = data;

  return (
    <div className="space-y-8">
      <p className="text-sm text-[#B3B3B3]">
        Last <strong className="text-white">{days} days</strong> — investment funnel events and feedback from the floating form.
      </p>

      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Growth metrics</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-[#737373]">Emails collected (total)</p>
            <p className="mt-1 text-2xl font-semibold text-white">{growth.emailsCollectedTotal}</p>
            <p className="mt-1 text-xs text-[#737373]">WaitlistUser rows</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Emails (period)</p>
            <p className="mt-1 text-2xl font-semibold text-white">{growth.emailsCollectedPeriod}</p>
            <p className="mt-1 text-xs text-[#737373]">New in last {days} days</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Conversion (analyze → save)</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {growth.analyzeToSavePercent != null ? `${growth.analyzeToSavePercent}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-[#737373]">Same {days}-day window</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Repeat sessions</p>
            <p className="mt-1 text-2xl font-semibold text-white">{growth.repeatVisitSessions}</p>
            <p className="mt-1 text-xs text-[#737373]">2+ page views / session</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Return-visit events</p>
            <p className="mt-1 text-2xl font-semibold text-white">{growth.returnVisitEvents}</p>
            <p className="mt-1 text-xs text-[#737373]">Tracked beacons</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Waitlist signups (events)</p>
            <p className="mt-1 text-2xl font-semibold text-white">{growth.waitlistEvents}</p>
            <p className="mt-1 text-xs text-[#737373]">Should match submissions</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Approx. users (sessions)" value={approxUsers} subtitle="Distinct session IDs with events" />
        <Card title="Analyses" value={counts.ANALYZE ?? 0} />
        <Card title="Saved deals" value={counts.SAVE_DEAL ?? 0} />
        <Card title="Compare uses" value={counts.COMPARE ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Page visits (events)</p>
          <p className="mt-2 text-2xl font-semibold text-white">{counts.VISIT_PAGE ?? 0}</p>
          <p className="mt-1 text-xs text-[#737373]">VISIT_PAGE rows (same window)</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Most used product feature</p>
          <p className="mt-2 text-xl font-semibold text-white">{mostUsedFeature ?? "—"}</p>
          <p className="mt-1 text-xs text-[#737373]">Among Analyze / Save / Compare (excludes visits)</p>
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Insights</p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-amber-100/95">
            {insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-white">Recent feedback</h2>
          <p className="mt-1 text-xs text-[#737373]">Latest messages (UserFeedback)</p>
          <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {feedback.length === 0 ? (
              <li className="text-sm text-[#737373]">No feedback yet.</li>
            ) : (
              feedback.map((f) => (
                <li key={f.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
                    <time dateTime={f.createdAt}>{new Date(f.createdAt).toLocaleString()}</time>
                    {f.rating != null ? (
                      <span className="text-amber-400/90">Rating: {f.rating}/5</span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[#B3B3B3]">{f.message}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Common words</h2>
          <p className="mt-1 text-xs text-[#737373]">Simple frequency (English stop words removed)</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {wordHighlights.length === 0 ? (
              <span className="text-sm text-[#737373]">Not enough text yet.</span>
            ) : (
              wordHighlights.map(({ word, count }) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-100"
                >
                  <span className="font-medium">{word}</span>
                  <span className="text-emerald-400/80">×{count}</span>
                </span>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
