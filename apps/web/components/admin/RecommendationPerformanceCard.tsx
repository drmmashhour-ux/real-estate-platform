export function RecommendationPerformanceCard(props: {
  impressions: number;
  clicks: number;
  ctr: number;
  since: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Recommendations</h3>
      <dl className="mt-4 grid gap-3 text-sm text-stone-200 sm:grid-cols-3">
        <div>
          <dt className="text-stone-500">Impressions</dt>
          <dd className="text-lg font-semibold">{props.impressions}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Clicks</dt>
          <dd className="text-lg font-semibold">{props.clicks}</dd>
        </div>
        <div>
          <dt className="text-stone-500">CTR</dt>
          <dd className="text-lg font-semibold">{(props.ctr * 100).toFixed(2)}%</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-stone-500">Since {props.since}</p>
    </div>
  );
}
