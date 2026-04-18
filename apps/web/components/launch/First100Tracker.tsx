type Row = {
  userId: string;
  emailSuffix: string;
  role: string;
  category: string;
  createdAt: string;
  acquisitionChannel: string;
  activation: { key: string; achieved: boolean; detail?: string };
  retention: { likelyReturned: boolean; notes: string };
};

export function First100Tracker({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Earliest signups (sample)</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Activation rules are computed — founder notes go through the activation API (audit).
      </p>
      <div className="mt-4 max-h-[420px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="py-2 pr-2">Email</th>
              <th className="py-2 pr-2">Role</th>
              <th className="py-2 pr-2">Channel</th>
              <th className="py-2 pr-2">Activation</th>
              <th className="py-2">Return signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-zinc-800/80 text-zinc-300">
                <td className="py-2 pr-2 font-mono">{r.emailSuffix}</td>
                <td className="py-2 pr-2">{r.role}</td>
                <td className="py-2 pr-2">{r.acquisitionChannel}</td>
                <td className="py-2 pr-2">{r.activation.achieved ? r.activation.key : "—"}</td>
                <td className="py-2 text-zinc-500">{r.retention.likelyReturned ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
