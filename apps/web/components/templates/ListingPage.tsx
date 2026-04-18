import type { ReactNode } from "react";
import { type as dsType } from "@/design-system";

/**
 * Browse / search listing hub — filters + grid slot.
 */
export function ListingPage({
  title,
  description,
  filters,
  toolbar,
  children,
}: {
  title: string;
  description?: string;
  filters?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className={dsType.h1}>{title}</h1>
        {description ? <p className={["mt-2 max-w-2xl", dsType.body].join(" ")}>{description}</p> : null}
      </header>
      {filters ? <div className="rounded-2xl border border-ds-border bg-ds-card p-4 shadow-ds-soft">{filters}</div> : null}
      {toolbar ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{toolbar}</div> : null}
      <div>{children}</div>
    </div>
  );
}
