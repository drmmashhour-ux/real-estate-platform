import type { ReactNode } from "react";
import { type as dsType } from "@/design-system";

/**
 * Metrics / reporting page — KPI row + chart grid.
 */
export function AnalyticsPage({
  title,
  description,
  kpi,
  children,
}: {
  title: string;
  description?: string;
  kpi?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className={dsType.h1}>{title}</h1>
        {description ? <p className={["mt-2 max-w-2xl", dsType.body].join(" ")}>{description}</p> : null}
      </header>
      {kpi ? <div>{kpi}</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </div>
  );
}
