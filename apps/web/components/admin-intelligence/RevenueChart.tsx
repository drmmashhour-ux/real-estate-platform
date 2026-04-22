"use client";

import { useMemo, useState } from "react";

const gold = "#D4AF37";

type Point = { date: string; revenueCents: number };

export function RevenueChart({
  series14d,
  revenue30dCents,
}: {
  series14d: Point[];
  revenue30dCents: number;
}) {
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly">("daily");

  const { points, label } = useMemo(() => {
    if (mode === "daily") {
      return { points: series14d, label: "Daily platform share (14d)" };
    }
    if (mode === "weekly") {
      const chunks: Point[] = [];
      for (let i = 0; i < series14d.length; i += 7) {
        const slice = series14d.slice(i, i + 7);
        const sum = slice.reduce((s, p) => s + p.revenueCents, 0);
        const last = slice[slice.length - 1];
        chunks.push({ date: last?.date ?? "", revenueCents: sum });
      }
      return { points: chunks, label: "Weekly totals (from 14d window)" };
    }
    const total = revenue30dCents;
    return {
      points: [{ date: "30d", revenueCents: total }],
      label: "Rolling 30-day platform revenue (approx.)",
    };
  }, [mode, series14d, revenue30dCents]);

  const max = Math.max(1, ...points.map((p) => p.revenueCents));

  return (
    <div
      className="rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: "rgba(212, 175, 55, 0.18)",
        background: "linear-gradient(160deg, rgba(14,14,14,0.98) 0%, rgba(6,6,6,1) 100%)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
            Revenue
          </p>
          <h3 className="font-serif text-lg text-white">{label}</h3>
        </div>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition"
              style={{
                background: mode === m ? "rgba(212, 175, 55, 0.18)" : "rgba(255,255,255,0.04)",
                color: mode === m ? gold : "#a1a1aa",
                border: mode === m ? `1px solid rgba(212,175,55,0.35)` : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex h-40 items-end gap-1 md:gap-2">
        {points.map((p) => (
          <div key={p.date + mode} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-md transition hover:opacity-90"
              style={{
                height: `${Math.max(6, (p.revenueCents / max) * 100)}%`,
                background: `linear-gradient(180deg, ${gold} 0%, rgba(212,175,55,0.35) 100%)`,
                boxShadow: "0 0 24px rgba(212,175,55,0.15)",
              }}
              title={`${p.date}: ${(p.revenueCents / 100).toFixed(0)} CAD`}
            />
            <span className="max-w-[3rem] truncate text-[10px] text-zinc-500">{p.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
