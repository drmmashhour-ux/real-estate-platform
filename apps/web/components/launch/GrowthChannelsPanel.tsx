type Ch = { channel: string; signups90d: number; verified90d: number };

export function GrowthChannelsPanel({
  channels,
  best,
}: {
  channels: Ch[];
  best: string | null;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Acquisition channels (90d)</h2>
      {best ? (
        <p className="mt-1 text-sm text-emerald-300/90">
          Best attributed channel: <span className="font-medium">{best}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-zinc-500">No channel beats zero — check UTM capture.</p>
      )}
      <ul className="mt-4 space-y-2 text-sm text-zinc-300">
        {channels.map((c) => (
          <li key={c.channel} className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
            <span>{c.channel}</span>
            <span className="tabular-nums text-zinc-400">
              {c.signups90d} signups · {c.verified90d} verified
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
