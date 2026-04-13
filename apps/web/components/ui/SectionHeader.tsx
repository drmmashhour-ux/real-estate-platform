import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">{eyebrow}</p>
        ) : null}
        <h2 className={`lecipm-heading-section max-w-3xl ${eyebrow ? "mt-3" : ""}`}>{title}</h2>
        {subtitle ? <p className="lecipm-subtitle mt-4 max-w-2xl">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 pt-1 sm:pt-0">{action}</div> : null}
    </div>
  );
}
