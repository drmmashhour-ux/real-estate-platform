"use client";

export type GuestOfferCard = {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  description: string | null;
  pricingType: string;
  priceCents: number;
  currency: string;
  isIncluded: boolean;
  requiresApproval: boolean;
  notes: string | null;
};

function pricingHint(type: string): string {
  switch (type) {
    case "PER_DAY":
      return "per night";
    case "PER_GUEST":
      return "per guest";
    case "PER_BOOKING":
      return "per stay";
    case "FREE":
      return "";
    default:
      return "each";
  }
}

export function ServiceCard({
  offer,
  quantity,
  suggested,
  onQuantityChange,
}: {
  offer: GuestOfferCard;
  quantity: number;
  suggested?: boolean;
  onQuantityChange: (q: number) => void;
}) {
  const sym = offer.currency === "USD" ? "$" : `${offer.currency} `;
  const hint = pricingHint(offer.pricingType);
  const priceLabel =
    offer.isIncluded || offer.pricingType === "FREE"
      ? "Included"
      : `${sym}${(offer.priceCents / 100).toFixed(offer.priceCents % 100 === 0 ? 0 : 2)}${hint ? ` ${hint}` : ""}`;

  return (
    <div
      className={`rounded-xl border p-4 ${
        suggested ? "border-emerald-500/35 bg-emerald-950/20" : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-200">{offer.name}</p>
          {offer.description ? <p className="mt-1 text-xs text-slate-500">{offer.description}</p> : null}
          {offer.notes ? <p className="mt-2 text-xs text-amber-200/80">Host note: {offer.notes}</p> : null}
          <p className="mt-2 text-sm text-emerald-300/90">{priceLabel}</p>
          {offer.requiresApproval ? (
            <p className="mt-1 text-xs text-amber-400/90">Subject to host confirmation after booking.</p>
          ) : null}
          {suggested ? <p className="mt-1 text-xs font-medium text-emerald-400/90">Suggested for this stay</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`qty-${offer.id}`}>
            Quantity for {offer.name}
          </label>
          <input
            id={`qty-${offer.id}`}
            type="number"
            min={0}
            max={20}
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-sm text-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
