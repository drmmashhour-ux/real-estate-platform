import type { ReactNode } from "react";

import { Card } from "@/components/lecipm-ui/card";

export function KpiCard({
  title,
  value,
  hint,
  footer,
}: {
  title: string;
  value: string;
  hint?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="hover:border-gold/30">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
      {footer}
    </Card>
  );
}
