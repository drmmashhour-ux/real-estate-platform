"use client";

import { paceToBarClass, type KpiPace } from "@/modules/field/field-kpi.config";
import { cn } from "@/lib/utils";

type Props = {
  percent: number;
  pace: KpiPace;
  className?: string;
};

export function FieldKpiProgressBar({ percent, pace, className }: Props) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}>
      <div
        className={cn("h-full rounded-full transition-all", paceToBarClass(pace))}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
