type Props = {
  rankingV1Enabled: boolean;
  rankingV2Enabled: boolean;
  configKeys: string[];
};

export function RankingInsightsCard({ rankingV1Enabled, rankingV2Enabled, configKeys }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Ranking</h3>
      <dl className="mt-4 space-y-2 text-sm text-stone-200">
        <div className="flex justify-between gap-4">
          <dt>Ranking v1</dt>
          <dd>{rankingV1Enabled ? "on" : "off"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Ranking v2 blend</dt>
          <dd>{rankingV2Enabled ? "on" : "off"}</dd>
        </div>
        <div className="pt-2">
          <dt className="text-stone-500">Active config keys</dt>
          <dd className="mt-1 font-mono text-xs text-stone-400">{configKeys.length ? configKeys.join(", ") : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
