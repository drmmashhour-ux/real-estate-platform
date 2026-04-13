/**
 * Closed-loop growth: listings → content machine → demand → optimization → compounding traffic.
 */
export function ContentTrafficFlywheelStrip() {
  const steps = [
    "Listings",
    "AI content machine",
    "Traffic",
    "Optimized listing",
    "Booking",
    "Data",
    "Optimization",
    "MORE traffic",
  ];

  return (
    <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-slate-950 to-black px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400/90">Growth flywheel</p>
      <p className="mt-1 text-xs text-slate-500">
        Each step feeds the next. Attribution and metrics close the loop so the engine improves what it publishes — then
        traffic compounds.
      </p>

      <div className="mt-3 hidden flex-wrap items-center gap-x-1 gap-y-2 text-sm md:flex">
        {steps.map((label, i) => (
          <span key={label} className="flex items-center gap-1">
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 font-medium text-slate-100">
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span className="px-0.5 text-sky-500/70" aria-hidden>
                →
              </span>
            ) : (
              <span className="ml-1 flex flex-wrap items-center gap-1 text-xs font-semibold text-sky-400/90">
                <span aria-hidden>↻</span>
                <span className="sr-only">loops back to</span>
                <span className="hidden lg:inline">feeds Listings · traffic</span>
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-200 md:hidden">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-col gap-1.5">
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 font-medium">{label}</span>
            {i < steps.length - 1 ? (
              <span className="pl-3 text-sky-500/80" aria-hidden>
                ↓
              </span>
            ) : (
              <span className="pl-3 text-xs font-semibold text-sky-400/90">
                <span aria-hidden>↻</span> feeds listings and traffic
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Reference: <code className="text-slate-400">docs/growth/content-traffic-flywheel.md</code>
      </p>
    </div>
  );
}
