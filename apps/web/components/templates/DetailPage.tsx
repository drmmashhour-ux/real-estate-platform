import type { ReactNode } from "react";
import { type as dsType } from "@/design-system";

/**
 * Detail / profile style page — optional back link, hero, primary column + optional aside.
 */
export function DetailPage({
  backLink,
  title,
  eyebrow,
  description,
  hero,
  actions,
  aside,
  children,
}: {
  backLink?: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  hero?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="space-y-8">
      {backLink ? <div className="text-sm">{backLink}</div> : null}

      {hero ? <div className="overflow-hidden rounded-2xl border border-ds-border shadow-ds-soft">{hero}</div> : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-gold">{eyebrow}</p> : null}
          <h1 className={eyebrow ? `mt-2 ${dsType.h1}` : dsType.h1}>{title}</h1>
          {description ? <p className={["mt-2 max-w-2xl", dsType.body].join(" ")}>{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </header>

      {aside ?
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">{children}</div>
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</aside>
        </div>
      : <div className="space-y-8">{children}</div>}
    </article>
  );
}
