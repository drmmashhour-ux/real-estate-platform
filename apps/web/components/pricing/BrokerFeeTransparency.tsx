function cad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

type BrokerageSnap = {
  payPerLeadCents: number;
  featuredListingMonthlyCents: number;
  promotedListingCents: number;
};

/**
 * Config-backed brokerage fee anchors — not income guarantees.
 * Shown alongside mortgage broker Pro/Free cards for transparency about the wider platform.
 */
export function BrokerFeeTransparency({
  brokerage,
  disclaimers,
}: {
  brokerage: BrokerageSnap;
  disclaimers: string[];
}) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-6 text-slate-200">
      <h2 className="text-lg font-semibold text-white">Residential CRM & leads (reference)</h2>
      <p className="mt-1 text-sm text-slate-500">
        Anchors from live product config. The mortgage lead plans above are separate; these numbers describe pay-per-lead and listing boosts on the brokerage side when those products are active in your market.
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Pay-per-lead (anchor)</dt>
          <dd className="tabular-nums text-amber-200/90">{cad(brokerage.payPerLeadCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Featured listing (monthly, reference)</dt>
          <dd className="tabular-nums text-amber-200/90">{cad(brokerage.featuredListingMonthlyCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Promoted listing (one-time, reference)</dt>
          <dd className="tabular-nums text-amber-200/90">{cad(brokerage.promotedListingCents)}</dd>
        </div>
      </dl>
      <ul className="mt-4 list-inside list-disc text-xs text-slate-500">
        {disclaimers.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
