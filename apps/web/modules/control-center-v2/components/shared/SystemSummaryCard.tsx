"use client";

import type { ReactNode } from "react";
import { HealthStatusBadge } from "./StatusBadge";
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";

export function SystemSummaryCard({
  title,
  status,
  summary,
  children,
}: {
  title: string;
  status: ControlCenterUnifiedStatus;
  summary: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <HealthStatusBadge status={status} />
      </div>
      <p className="mt-2 text-xs text-zinc-400">{summary}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
