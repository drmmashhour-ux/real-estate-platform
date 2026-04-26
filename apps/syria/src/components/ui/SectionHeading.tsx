import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--darlink-text-muted)]">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight text-[color:var(--darlink-text)] md:text-2xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-[color:var(--darlink-text-muted)]">{description}</p> : null}
    </div>
  );
}
