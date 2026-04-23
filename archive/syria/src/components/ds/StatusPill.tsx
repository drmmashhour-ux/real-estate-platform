import { cn } from "@/lib/cn";

export type StatusPillTone = "neutral" | "success" | "warning" | "accent";

const tones: Record<StatusPillTone, string> = {
  neutral: "bg-[color:var(--darlink-surface-muted)] text-[color:var(--darlink-text)] ring-1 ring-[color:var(--darlink-border)]",
  success: "bg-[color:var(--darlink-accent)]/12 text-[color:var(--darlink-accent)] ring-1 ring-[color:var(--darlink-accent)]/25",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  accent: "bg-[color:var(--darlink-sand)]/40 text-[color:var(--darlink-text)] ring-1 ring-[color:var(--darlink-border)]",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
