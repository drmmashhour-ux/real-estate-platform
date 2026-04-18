import type { ReactNode } from "react";

/**
 * Chart / visualization container — title + full-width chart slot.
 */
export function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card p-4 shadow-ds-soft sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-ds-text">{title}</h3>
          {description ? <p className="mt-1 text-sm text-ds-text-secondary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-6 min-h-[200px] w-full">{children}</div>
    </div>
  );
}
