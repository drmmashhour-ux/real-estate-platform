import type { ReactNode } from "react";
import { type as dsType } from "@/design-system";

/**
 * Standard dashboard page scaffold — title row, optional KPI strip, main + optional insights column.
 */
export function DashboardPage({
  title,
  description,
  actions,
  kpi,
  insights,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  kpi?: ReactNode;
  insights?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className={dsType.h1}>{title}</h1>
          {description ? <p className={["mt-2 max-w-2xl", dsType.body].join(" ")}>{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      {kpi ? <div>{kpi}</div> : null}

      {insights ?
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">{children}</div>
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">{insights}</aside>
        </div>
      : <div className="space-y-8">{children}</div>}
    </div>
  );
}
