export function ExperimentOverviewCard(props: { running: number; draft: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Experiments</h3>
      <dl className="mt-4 flex gap-8 text-sm text-stone-200">
        <div>
          <dt className="text-stone-500">Running</dt>
          <dd className="text-2xl font-semibold">{props.running}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Draft</dt>
          <dd className="text-2xl font-semibold">{props.draft}</dd>
        </div>
      </dl>
    </div>
  );
}
