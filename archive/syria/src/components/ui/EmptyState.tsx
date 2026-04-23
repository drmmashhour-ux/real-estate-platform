import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed p-8">
      <p className="font-medium text-[color:var(--darlink-text)]">{title}</p>
      {description ? <p className="mt-2 text-sm text-[color:var(--darlink-text-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
