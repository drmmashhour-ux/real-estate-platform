import type { ReactNode } from "react";
import { type as typeScale } from "@/design-system/typography";

export type KPIItem = {
  label: string;
  value: ReactNode;
  hint?: string;
  id?: string;
};

/**
 * Top-of-dashboard metric strip — responsive 2–4 columns.
 */
export function KPIGrid({ items, className = "" }: { items: KPIItem[]; className?: string }) {
  return (
    <div className={["grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className].join(" ")}>
      {items.map((k, i) => (
        <div
          key={k.id ?? String(i)}
          className="rounded-2xl border border-ds-border bg-ds-card p-4 shadow-ds-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">{k.label}</p>
          <p className={["mt-2", typeScale.kpi].join(" ")}>{k.value}</p>
          {k.hint ? <p className="mt-1 text-xs text-ds-text-secondary">{k.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
