"use client";

const STYLES: Record<string, string> = {
  go: "border-emerald-900/60 bg-emerald-950/40 text-emerald-100",
  caution: "border-amber-900/60 bg-amber-950/40 text-amber-100",
  hold: "border-rose-900/60 bg-rose-950/40 text-rose-100",
  unknown: "border-zinc-700 bg-zinc-900/50 text-zinc-300",
};

function inferReadiness(signals: string[]): keyof typeof STYLES {
  const s = signals.join(" ").toLowerCase();
  if (s.includes("hold")) return "hold";
  if (s.includes("caution")) return "caution";
  if (s.includes("go")) return "go";
  return "unknown";
}

export function WarRoomBanner({ goNoGoSignals, launchSummary }: { goNoGoSignals: string[]; launchSummary: string }) {
  const key = inferReadiness(goNoGoSignals);
  const label =
    key === "go" ? "GO" : key === "caution" ? "CAUTION" : key === "hold" ? "NO-GO / HOLD" : "READINESS UNCLEAR";
  return (
    <div className={`rounded-xl border px-4 py-3 ${STYLES[key]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 text-sm">{launchSummary}</p>
    </div>
  );
}
