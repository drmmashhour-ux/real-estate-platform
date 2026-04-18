"use client";

import { useEffect, useState } from "react";
import type { TimeseriesMetricId } from "@/modules/broker-kpis/broker-kpis.types";

type Point = { date: string; value: number };

export function BrokerTrendChart({
  metric,
  window,
}: {
  metric: TimeseriesMetricId;
  window: "7d" | "30d" | "quarter";
}) {
  const [points, setPoints] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/broker/kpis/timeseries?metric=${metric}&window=${window}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setErr("Unable to load series");
          return;
        }
        const data = (await res.json()) as { series?: { points?: Point[] } };
        if (!cancelled) setPoints(data.series?.points ?? []);
      } catch {
        if (!cancelled) setErr("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [metric, window]);

  const max = Math.max(1, ...points.map((p) => p.value));

  if (err) {
    return <p className="text-xs text-red-400/90">{err}</p>;
  }

  return (
    <div className="flex h-24 items-end gap-px">
      {points.map((p) => (
        <div
          key={p.date}
          title={`${p.date}: ${p.value}`}
          className="min-w-[6px] flex-1 rounded-t bg-gradient-to-t from-amber-900/30 to-amber-500/80"
          style={{ height: `${Math.max(8, (p.value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
