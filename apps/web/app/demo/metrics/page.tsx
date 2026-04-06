import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import {
  getDemoMetricsSnapshot,
  getDemoRevenuePreview,
} from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

export default async function DemoMetricsPage() {
  const [metrics, revenue] = await Promise.all([getDemoMetricsSnapshot(), getDemoRevenuePreview()]);
  const script = getDemoStepScript("revenue");
  const points = getShortTalkingPoints("revenue");

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">Revenue & traction</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{script}</p>
        <p className="mt-2 rounded-lg border border-amber-900/30 bg-amber-950/15 px-3 py-2 text-xs text-amber-200/80">
          {metrics.dataSourceLabel}
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">A) Marketplace activity</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
            <p className="text-xs text-slate-500">Bookings (DB count)</p>
            <p className="mt-2 text-3xl font-semibold text-white">{metrics.bookingsCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
            <p className="text-xs text-slate-500">Inquiries / CRM leads (DB count)</p>
            <p className="mt-2 text-3xl font-semibold text-white">{metrics.inquiriesCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
            <p className="text-xs text-slate-500">Revenue framing</p>
            <p className="mt-2 text-lg font-semibold text-amber-200/90">{metrics.revenueLabel}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">B) Conversion</h3>
        <p className="text-sm text-slate-400">
          Discovery → property → action → ops handoff. Demo mode highlights the plumbing; qualify real conversion rates
          with your analytics outside this surface.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">C) Monetization</h3>
        <div className="space-y-3">
          {revenue.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <div>
                <p className="font-medium text-white">{row.label}</p>
                <p className="mt-1 text-sm text-slate-500">{row.detail}</p>
                {row.isSimulated ? (
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-500/70">Simulated / illustrative</p>
                ) : null}
              </div>
              <p className="text-lg font-semibold text-amber-200/90">{row.amountLabel}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">D) Traction summary</h3>
        <p className="text-sm text-slate-400">{metrics.growthNote}</p>
        <ul className="list-inside list-disc text-sm text-slate-500">
          {metrics.monetizationLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <ul className="text-sm text-slate-500">
        {points.map((p) => (
          <li key={p}>— {p}</li>
        ))}
      </ul>

      <InvestorDemoClient highlightStep="revenue" />
    </div>
  );
}
