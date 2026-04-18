import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function RecommendationCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: ReactNode;
  cta?: ReactNode;
}) {
  return (
    <Card glow className="border-ds-gold/25 bg-ds-surface">
      <p className="text-xs font-semibold uppercase tracking-wide text-ds-gold">Suggested next step</p>
      <h4 className="mt-2 font-semibold text-ds-text">{title}</h4>
      <div className="mt-2 text-sm text-ds-text-secondary">{body}</div>
      {cta ? <div className="mt-4">{cta}</div> : null}
      <p className="mt-3 text-[10px] text-ds-text-secondary/90">
        Recommendations are informational — verify before financial or legal decisions.
      </p>
    </Card>
  );
}
