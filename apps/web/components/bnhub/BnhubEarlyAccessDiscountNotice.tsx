export function BnhubEarlyAccessDiscountNotice({
  percentOff,
  promoLabel,
  className = "",
}: {
  /** From listing early-access field or active host promotion */
  percentOff: number | null | undefined;
  /** Optional host promotion label */
  promoLabel?: string | null;
  className?: string;
}) {
  if (percentOff == null || percentOff <= 0) return null;
  return (
    <div
      className={`rounded-xl border border-emerald-500/40 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-100 ${className}`}
    >
      <span className="font-semibold text-emerald-50">Early access discount applied</span>
      <span className="text-emerald-100/90"> — {percentOff}% off eligible nights</span>
      {promoLabel ? <span className="block text-xs text-emerald-200/80">{promoLabel}</span> : null}
      <span className="mt-1 block text-[11px] text-emerald-200/70">
        Promo codes and host promotions are applied at checkout when configured.
      </span>
    </div>
  );
}
