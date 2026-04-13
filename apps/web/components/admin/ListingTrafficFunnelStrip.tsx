import { Fragment } from "react";

/**
 * Admin visual for the listing → content → video → post → traffic model.
 */
export function ListingTrafficFunnelStrip() {
  const steps = [
    { title: "Listing added", detail: "Publish → enqueue (pipeline flags)" },
    { title: "Content generated", detail: "5 styles · hook → visual → value → CTA" },
    { title: "Video created", detail: "9:16 card (JPEG); MP4 when tool wired" },
    { title: "Posted automatically", detail: "Schedules + APIs when enabled" },
    { title: "Traffic", detail: "Views · ads · bookings" },
  ];

  const card = (s: (typeof steps)[0]) => (
    <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <p className="text-xs font-semibold text-white">{s.title}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{s.detail}</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-premium-gold/20 bg-gradient-to-br from-[#0f0f0f] to-black/80 px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-premium-gold/80">Target funnel</p>

      <div className="mt-3 hidden items-stretch gap-0 md:flex">
        {steps.map((s, i) => (
          <Fragment key={`row-${s.title}`}>
            {card(s)}
            {i < steps.length - 1 ? (
              <div
                className="flex w-8 shrink-0 items-center justify-center text-lg text-premium-gold/45"
                aria-hidden
              >
                →
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 md:hidden">
        {steps.map((s, i) => (
          <Fragment key={`col-${s.title}`}>
            {card(s)}
            {i < steps.length - 1 ? (
              <div className="py-0.5 text-center text-lg text-premium-gold/45" aria-hidden>
                ↓
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Reference: <code className="text-slate-400">docs/growth/listing-to-traffic-funnel.md</code>
      </p>
    </div>
  );
}
