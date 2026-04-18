"use client";

export function RevenueChart({
  series,
}: {
  series: { month: string; cents: number }[];
}) {
  const max = Math.max(1, ...series.map((s) => s.cents));
  return (
    <div className="flex h-40 items-end gap-2">
      {series.map((s) => (
        <div key={s.month} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-premium-gold/70"
            style={{ height: `${(s.cents / max) * 100}%`, minHeight: "4px" }}
            title={`${s.month}: $${(s.cents / 100).toLocaleString("en-CA")}`}
          />
          <span className="rotate-45 text-[9px] text-slate-500">{s.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
