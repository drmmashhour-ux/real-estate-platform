import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function InsightCard({
  title,
  children,
  confidenceLabel,
  footer,
}: {
  title: string;
  children: ReactNode;
  /** e.g. "Medium" — never fake numeric certainty */
  confidenceLabel?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className="border-ds-border bg-ds-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-semibold text-ds-text">{title}</h4>
        {confidenceLabel ? (
          <span className="rounded-full border border-ds-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
            {confidenceLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-sm leading-relaxed text-ds-text-secondary">{children}</div>
      {footer ? <div className="mt-4 border-t border-ds-border pt-3 text-xs text-ds-text-secondary">{footer}</div> : null}
    </Card>
  );
}
