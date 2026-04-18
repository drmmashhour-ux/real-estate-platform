import type { ReactNode } from "react";
import { type as dsType } from "@/design-system";

/**
 * Focused form flow — title + optional step indicator slot + card body.
 */
export function FormPage({
  title,
  description,
  stepIndicator,
  children,
}: {
  title: string;
  description?: string;
  stepIndicator?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className={dsType.h2}>{title}</h1>
        {description ? <p className={["mt-2", dsType.body].join(" ")}>{description}</p> : null}
      </header>
      {stepIndicator}
      <div className="rounded-2xl border border-ds-border bg-ds-card p-6 shadow-ds-soft sm:p-8">{children}</div>
    </div>
  );
}
