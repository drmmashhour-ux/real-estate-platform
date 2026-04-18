/**
 * Advisory trust / urgency lines for the BNHub conversion layer (V1).
 * Only renders factual copy supported by props — no invented scarcity.
 */
export function BnhubGuestConversionPropertyBoost({
  verified,
  highDemandArea,
  recentlyViewed,
  recentlyBooked,
  bookNowLabel = "Book now in seconds",
  reserveLabel = "Secure your stay instantly",
  frictionMode = "default",
  conversionAligned = true,
  sampleStayNights = 2,
  nightPriceCents,
  cleaningFeeCents = 0,
  sampleTotalEstimateCents,
  currencyCode = "CAD",
}: {
  verified: boolean;
  highDemandArea: boolean;
  recentlyViewed: boolean;
  recentlyBooked: boolean;
  /** Primary CTA headline */
  bookNowLabel?: string;
  reserveLabel?: string;
  frictionMode?: "reassurance" | "social_proof" | "default";
  /** When false, avoid funnel-specific positioning copy (flags misaligned). */
  conversionAligned?: boolean;
  sampleStayNights?: number;
  nightPriceCents: number;
  cleaningFeeCents?: number;
  sampleTotalEstimateCents: number;
  currencyCode?: string;
}) {
  const signals: string[] = [];
  if (verified) signals.push("Verified listing");
  if (highDemandArea) signals.push("High-demand area");
  if (recentlyViewed) signals.push("Recently viewed on BNHUB");
  if (recentlyBooked) signals.push("Recently booked");

  if (frictionMode === "social_proof") {
    if (highDemandArea) signals.push("Popular in this area");
    if (recentlyViewed) signals.push("Guests are viewing this stay");
  }

  const microTrust =
    frictionMode === "reassurance"
      ? ["Secure payment", "Instant confirmation after checkout"]
      : ["No hidden fees in the price summary", "Instant confirmation when eligible"];

  const formattedTotal = (sampleTotalEstimateCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
  });
  const nightly = (nightPriceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
  });

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-[12px] leading-snug text-emerald-950">
      {!conversionAligned ? (
        <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-950">
          Conversion insights need aligned tracking flags — hero tips stay generic until both server and client BNHub
          conversion flags are on.
        </p>
      ) : null}
      {signals.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {signals.map((s) => (
            <li
              key={s}
              className="rounded-full border border-emerald-300/60 bg-white/80 px-2.5 py-0.5 font-semibold text-emerald-900"
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {microTrust.map((s) => (
          <li
            key={s}
            className="rounded-full border border-emerald-200/90 bg-white/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900"
          >
            {s}
          </li>
        ))}
      </ul>
      <p className="text-[11px] font-medium text-emerald-900/90">
        <span className="font-bold">{bookNowLabel}</span>
        {" · "}
        <span>{reserveLabel}</span>
      </p>
      <div className="rounded-lg border border-emerald-200/70 bg-white/70 px-2.5 py-2 text-[11px] text-emerald-950">
        <p className="font-semibold text-emerald-900">Price clarity</p>
        <p className="mt-1 tabular-nums">
          {sampleStayNights} nights × {nightly}/night + fees →{" "}
          <span className="font-bold">{formattedTotal}</span> estimated total before taxes (sample dates).
        </p>
        {cleaningFeeCents > 0 ? (
          <p className="mt-1 text-[10px] text-emerald-900/75">
            Cleaning fee {(cleaningFeeCents / 100).toLocaleString(undefined, {
              style: "currency",
              currency: currencyCode,
            })}{" "}
            included in sample when applicable.
          </p>
        ) : (
          <p className="mt-1 text-[10px] text-emerald-900/75">Cleaning fee shown in checkout summary when applicable.</p>
        )}
      </div>
    </div>
  );
}
