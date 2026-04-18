/**
 * Advisory trust / urgency lines for the BNHub conversion layer (V1).
 * Only renders factual copy supported by props — no invented scarcity.
 */
export function BnhubGuestConversionPropertyBoost({
  verified,
  highDemandArea,
  recentlyViewed,
  recentlyBooked,
  bookNowLabel,
  reserveLabel,
}: {
  verified: boolean;
  highDemandArea: boolean;
  recentlyViewed: boolean;
  recentlyBooked: boolean;
  bookNowLabel: string;
  reserveLabel: string;
}) {
  const signals: string[] = [];
  if (verified) signals.push("Verified listing");
  if (highDemandArea) signals.push("High-demand area");
  if (recentlyViewed) signals.push("Recently viewed on BNHUB");
  if (recentlyBooked) signals.push("Recently booked");

  if (signals.length === 0 && !bookNowLabel && !reserveLabel) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-[12px] leading-snug text-emerald-950">
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
      <p className="text-[11px] font-medium text-emerald-900/90">
        <span className="font-bold">{bookNowLabel}</span>
        {" · "}
        <span>{reserveLabel}</span>
      </p>
    </div>
  );
}
