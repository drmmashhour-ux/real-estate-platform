import type { ReactNode } from "react";

/**
 * Right-column insights shell — pair with `DashboardLayout` `aside` or grid templates.
 */
export function InsightsPanel({
  title = "Insights",
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["space-y-4 rounded-2xl border border-ds-border bg-ds-surface/80 p-4 shadow-ds-soft sm:p-5", className].join(" ")}>
      <div>
        <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-ds-text">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-ds-text-secondary">{subtitle}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
