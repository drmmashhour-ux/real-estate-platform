"use client";

export function OccupancyChart({ points }: { points: { date: string; cents: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.cents));
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-xs font-medium text-neutral-400">Revenue last days</p>
      <div className="mt-2 flex h-24 items-end gap-1">
        {points.slice(-14).map((p) => (
          <div
            key={p.date}
            title={`${p.date}: ${p.cents}`}
            className="flex-1 rounded-t bg-premium-gold/50"
            style={{ height: `${Math.max(8, (p.cents / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
