export function ConversionFunnelCard(props: {
  rates: { ctr: number; saveRate: number; inquiryRate: number; bookingStartRate: number; bookingCompleteRate: number };
}) {
  const fmt = (n: number) => `${(n * 100).toFixed(2)}%`;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">EventLog conversion</h3>
      <dl className="mt-4 grid gap-2 text-sm text-stone-200 sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">CTR (imp→click)</dt>
          <dd>{fmt(props.rates.ctr)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Save rate</dt>
          <dd>{fmt(props.rates.saveRate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Inquiry rate</dt>
          <dd>{fmt(props.rates.inquiryRate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Booking start</dt>
          <dd>{fmt(props.rates.bookingStartRate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Booking complete</dt>
          <dd>{fmt(props.rates.bookingCompleteRate)}</dd>
        </div>
      </dl>
    </div>
  );
}
