"use client";

import type { TimeSeriesPoint } from "@/modules/analytics/types";

type Props = { series: TimeSeriesPoint[] };

/** Minimal line-style chart using CSS — total activity per day. */
export function AdminTimeSeriesChart({ series }: Props) {
  const totals = series.map((p) => p.newUsers + p.newClients + p.offersCreated + p.documentsUploaded);
  const max = Math.max(1, ...totals);

  return (
    <div className="space-y-1">
      <div className="flex h-36 items-end gap-px">
        {series.map((p, i) => {
          const t = totals[i] ?? 0;
          const h = Math.round((t / max) * 100);
          return (
            <div key={p.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end">
              <div
                className="w-full min-h-[2px] rounded-t bg-gradient-to-t from-amber-700/50 to-amber-400/90 transition-all group-hover:from-amber-600 group-hover:to-amber-300"
                style={{ height: `${Math.max(2, h)}%` }}
                title={`${p.date}: ${t}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#737373]">
        <span>{series[0]?.date ?? ""}</span>
        <span>{series[series.length - 1]?.date ?? ""}</span>
      </div>
      <p className="text-xs text-[#737373]">
        Bar height = sum of new users, clients, offers, and documents per day (same range as above).
      </p>
    </div>
  );
}
