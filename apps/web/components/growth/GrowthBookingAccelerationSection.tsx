import { analyzeBookingFunnel } from "@/modules/growth/booking-funnel-analysis.service";
import {
  build7DayBookingPlan,
  getActionsForCalendarDay,
  getCurrentAccelerationStage,
} from "@/modules/launch/booking-acceleration.service";

const FUNNEL_DAYS = 7;

export async function GrowthBookingAccelerationSection() {
  const funnel = await analyzeBookingFunnel(FUNNEL_DAYS);
  const plan = build7DayBookingPlan();
  const stage = getCurrentAccelerationStage();
  const todayPlan = getActionsForCalendarDay();

  const c = funnel.counts;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/90">7-Day Booking Acceleration</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Sprint plan & funnel</h2>
        </div>
        <p className="text-xs text-zinc-500">Planning only — no automated spend or checkout changes</p>
      </div>

      <p className="mt-3 text-sm text-zinc-400">{plan.summary}</p>

      <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">Actions for today (calendar day {todayPlan.day})</p>
        <p className="mt-1 text-sm font-medium text-zinc-100">{todayPlan.title}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
          {todayPlan.bullets.map((b, i) => (
            <li key={`today-${i}`}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-900/30 bg-cyan-950/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/90">Current stage (calendar map)</p>
        <p className="mt-1 text-base font-semibold text-zinc-100">{stage.rangeLabel}</p>
        <p className="mt-2 text-xs text-zinc-400">{stage.hint}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {stage.bullets.map((b, i) => (
            <li key={`stage-${i}`}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Booking funnel ({FUNNEL_DAYS}d)</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/80 px-3 py-2">
            <dt className="text-xs text-zinc-500">Page + landing views → listing views</dt>
            <dd className="font-medium text-zinc-200">
              {c.pageViews + c.landingViews} → {c.listingViews}{" "}
              <span className="text-zinc-500">
                ({funnel.rates.viewToListingPercent != null ? `${funnel.rates.viewToListingPercent}%` : "—"})
              </span>
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-800/80 px-3 py-2">
            <dt className="text-xs text-zinc-500">Listing views → checkout start</dt>
            <dd className="font-medium text-zinc-200">
              {c.listingViews} → {c.bookingStarted}{" "}
              <span className="text-zinc-500">
                ({funnel.rates.listingToCheckoutPercent != null ? `${funnel.rates.listingToCheckoutPercent}%` : "—"})
              </span>
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-800/80 px-3 py-2 sm:col-span-2">
            <dt className="text-xs text-zinc-500">Checkout → completed</dt>
            <dd className="font-medium text-zinc-200">
              {c.bookingStarted} → {c.bookingCompleted}{" "}
              <span className="text-zinc-500">
                ({funnel.rates.checkoutToPaidPercent != null ? `${funnel.rates.checkoutToPaidPercent}%` : "—"})
              </span>
            </dd>
          </div>
        </dl>
        <p className="mt-3 rounded-lg border border-amber-900/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          <span className="font-semibold">Bottleneck: {funnel.bottleneck}</span> — {funnel.recommendation}
        </p>
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          {funnel.dropOffs.map((d) => (
            <li key={d.label}>
              <span className="text-zinc-400">{d.label}:</span> {d.fromCount} → {d.toCount}
              {d.ratePercent != null ? ` (${d.ratePercent}% )` : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/80 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">Phase map</h3>
        <ul className="mt-2 space-y-2 text-xs text-zinc-400">
          {plan.phases.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-800/60 bg-black/20 px-2 py-1">
              <span className="font-medium text-zinc-200">{p.title}</span>
              <span className="text-zinc-600"> · {p.bullets.length} action lines</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 border-t border-zinc-800/80 pt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Full 7-day playbook</h3>
        <p className="mt-1 text-xs text-zinc-500">Generated {new Date(plan.generatedAt).toLocaleString()}</p>
        <ol className="mt-4 space-y-4">
          {plan.days.map((d) => (
            <li key={d.day} className="rounded-lg border border-zinc-800/60 bg-black/20 px-3 py-2">
              <p className="text-sm font-semibold text-zinc-100">
                Day {d.day}: {d.title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                {d.bullets.map((b, i) => (
                  <li key={`d${d.day}-${i}`}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
