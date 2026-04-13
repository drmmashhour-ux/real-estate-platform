import Link from "next/link";

/**
 * At-a-glance signals hosts need to run calmer stays: aligned with “fewer disputes”
 * (clear expectations, early risk visibility, payout readiness) vs. opaque OTA dashboards.
 */
export function HostPeaceOfMindStrip({
  trustScore,
  publishedListings,
  inProgressListings,
  upcomingConfirmed,
  guestsArrivingNext7Days,
  attentionSignalCount,
  stripePayoutsReady,
}: {
  trustScore: number | null;
  publishedListings: number;
  inProgressListings: number;
  upcomingConfirmed: number;
  guestsArrivingNext7Days: number;
  attentionSignalCount: number;
  stripePayoutsReady: boolean;
}) {
  const trustLabel =
    trustScore == null ? "—" : trustScore >= 85 ? "Strong" : trustScore >= 65 ? "Good" : "Build";

  return (
    <section
      className="mb-8 rounded-2xl border border-premium-gold/25 bg-[linear-gradient(180deg,rgb(0_0_0/0.55),rgb(8_8_8/0.92))] p-5 shadow-[0_0_40px_rgb(212_175_55/0.06)] sm:p-6"
      aria-labelledby="host-command-center-heading"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="host-command-center-heading" className="text-sm font-semibold uppercase tracking-[0.18em] text-premium-gold/90">
            Command center
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-neutral-400">
            One place to see trust, arrivals, and anything that needs attention — clarity for you and guests, fewer last-minute
            surprises than juggling MLS portals, OTA extranets, and spreadsheets.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Host trust</p>
          <p className="mt-1 text-2xl font-semibold text-white">{trustScore ?? "—"}</p>
          <p className="text-xs text-premium-gold/80">{trustLabel}</p>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">Visible performance drivers, not a black box.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Listings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{publishedListings}</p>
          <p className="text-xs text-neutral-400">live</p>
          <p className="mt-2 text-[11px] text-neutral-500">
            {inProgressListings > 0 ? `${inProgressListings} in draft or review` : "All set or add another stay"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Arrivals (7 days)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{guestsArrivingNext7Days}</p>
          <p className="text-xs text-neutral-400">{upcomingConfirmed} total upcoming</p>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">Plan messaging and turnover without tab overload.</p>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 ${
            attentionSignalCount > 0
              ? "border-premium-gold/40 bg-black/50"
              : "border-premium-gold/20 bg-black/35"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Early signals</p>
          <p className="mt-1 text-2xl font-semibold text-white">{attentionSignalCount}</p>
          <p className="text-xs text-neutral-400">{attentionSignalCount > 0 ? "review suggested" : "nothing elevated"}</p>
          {attentionSignalCount > 0 ? (
            <Link
              href="#host-attention"
              className="mt-2 inline-block text-[11px] font-medium text-premium-gold underline-offset-2 hover:underline"
            >
              Jump to details
            </Link>
          ) : (
            <p className="mt-2 text-[11px] leading-snug text-neutral-500">Catch friction before it becomes a dispute.</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Payouts</p>
          <p className={`mt-1 text-lg font-semibold ${stripePayoutsReady ? "text-emerald-300" : "text-amber-200"}`}>
            {stripePayoutsReady ? "Connected" : "Action needed"}
          </p>
          <p className="text-xs text-neutral-400">Stripe Connect</p>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            {stripePayoutsReady ? "Funds route cleanly after completed stays." : "Finish onboarding so payouts are never ambiguous."}
          </p>
        </div>
      </div>
    </section>
  );
}
