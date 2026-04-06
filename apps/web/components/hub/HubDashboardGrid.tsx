import type { ReactNode } from "react";

type HubDashboardGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
};

export function HubDashboardGrid({ children, columns = 2 }: HubDashboardGridProps) {
  const grid =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 gap-4 md:grid-cols-2";
  return <div className={`grid ${grid}`}>{children}</div>;
}
