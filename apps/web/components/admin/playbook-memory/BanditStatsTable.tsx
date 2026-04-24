type B = {
  id: string;
  domain: string;
  playbookId: string;
  impressions: number;
  successes: number;
  failures: number;
  avgReward: number | null;
  updatedAt: string;
};

export function BanditStatsTable({ rows }: { rows: B[] }) {
  if (!rows.length) {
    return <p className="text-sm text-white/50">No bandit stat rows in range.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-black/50 text-xs uppercase text-white/50">
          <tr>
            <th className="p-2">Playbook</th>
            <th className="p-2">Impressions</th>
            <th className="p-2">S/F</th>
            <th className="p-2">avgReward</th>
            <th className="p-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-t border-white/5 text-white/80">
              <td className="p-2 font-mono text-xs">{b.playbookId}</td>
              <td className="p-2">{b.impressions}</td>
              <td className="p-2 text-xs">
                {b.successes}/{b.failures}
              </td>
              <td className="p-2 text-xs">{b.avgReward == null ? "—" : b.avgReward.toFixed(3)}</td>
              <td className="p-2 text-xs text-white/45">{b.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
