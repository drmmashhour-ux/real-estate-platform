"use client";

import { useEffect, useState } from "react";
import type { CompanyTimeseriesMetricId } from "@/modules/company-metrics/company-metrics.types";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

type Point = { date: string; value: number };

export function OwnerTrendChart({
  metric,
  window,
}: {
  metric: CompanyTimeseriesMetricId;
  window: KpiWindow;
}) {
  const [points, setPoints] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/owner/trends?metric=${metric}&window=${window}`, { credentials: "include" });
        if (!res.ok) {
          setErr("Série indisponible");
          return;
        }
        const data = (await res.json()) as { series?: { points?: Point[] } };
        if (!cancelled) setPoints(data.series?.points ?? []);
      } catch {
        if (!cancelled) setErr("Erreur réseau");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [metric, window]);

  const max = Math.max(1, ...points.map((p) => p.value));

  if (err) return <p className="text-xs text-red-400/90">{err}</p>;

  return (
    <div className="flex h-28 items-end gap-px">
      {points.map((p) => (
        <div
          key={p.date}
          title={`${p.date}: ${p.value}`}
          className="min-w-[5px] flex-1 rounded-t bg-gradient-to-t from-amber-950/40 to-amber-400/85"
          style={{ height: `${Math.max(8, (p.value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
