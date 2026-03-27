"use client";

export type ImpactItem = {
  label: string;
  impact: "positive" | "negative";
  /** 0–100 relative strength for bar width */
  strength: number;
};

function barColor(impact: "positive" | "negative") {
  return impact === "positive" ? "bg-emerald-500/80" : "bg-rose-500/80";
}

export function ImpactBreakdown({ items, title = "Impact breakdown" }: { items: ImpactItem[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it.label} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{it.label}</span>
              <span className={it.impact === "positive" ? "text-emerald-400" : "text-rose-400"}>
                {it.impact === "positive" ? "+ influence" : "− influence"}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${barColor(it.impact)}`}
                style={{ width: `${Math.min(100, Math.max(8, it.strength))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
