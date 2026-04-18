import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "sand" | "accent" | "muted";

const toneClass: Record<BadgeTone, string> = {
  sand: "bg-[color:var(--darlink-sand)]/35 text-[color:var(--darlink-text)] ring-1 ring-[color:var(--darlink-border)]",
  accent: "bg-[color:var(--darlink-accent)]/15 text-[color:var(--darlink-accent)] ring-1 ring-[color:var(--darlink-accent)]/25",
  muted: "bg-[color:var(--darlink-surface-muted)] text-[color:var(--darlink-text-muted)] ring-1 ring-[color:var(--darlink-border)]",
};

export function Badge({
  tone = "muted",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
