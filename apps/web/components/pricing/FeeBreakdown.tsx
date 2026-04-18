type Snap = {
  bnhub: {
    guestServiceFeePercent: number;
    hostPlatformFeePercentOnLodging: number;
    marketingBookingFeePercent: number;
  };
  disclaimers: string[];
};

export function FeeBreakdown({ snapshot }: { snapshot: Snap }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-slate-200">
      <h2 className="text-lg font-semibold text-white">BNHub fee transparency (lodging)</h2>
      <p className="mt-1 text-sm text-slate-500">
        Checkout uses these anchors on the lodging subtotal after discounts — guests see full breakdown before paying.
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Guest service fee</dt>
          <dd className="tabular-nums text-emerald-300">{snapshot.bnhub.guestServiceFeePercent}%</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Host platform fee (lodging subtotal)</dt>
          <dd className="tabular-nums text-emerald-300">{snapshot.bnhub.hostPlatformFeePercentOnLodging}%</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-800 pt-2 text-slate-500">
          <dt>Marketing reference (`PRICING.bookingFeePercent`)</dt>
          <dd className="tabular-nums">{(snapshot.bnhub.marketingBookingFeePercent * 100).toFixed(1)}%</dd>
        </div>
      </dl>
      <ul className="mt-4 list-inside list-disc text-xs text-slate-500">
        {snapshot.disclaimers.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
