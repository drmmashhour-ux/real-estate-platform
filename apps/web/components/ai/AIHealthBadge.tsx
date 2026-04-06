"use client";

const GOLD = "#D4AF37";

export function AIHealthBadge({
  killSwitch,
  pausedUntil,
}: {
  killSwitch: boolean;
  pausedUntil: Date | string | null;
}) {
  const paused = pausedUntil ? new Date(pausedUntil).getTime() > Date.now() : false;
  if (killSwitch) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-500/50 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-200">
        Kill switch ON
      </span>
    );
  }
  if (paused) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-100">
        Paused until {new Date(pausedUntil as string).toLocaleString()}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
      style={{ borderColor: `${GOLD}55` }}
    >
      Operating
    </span>
  );
}
