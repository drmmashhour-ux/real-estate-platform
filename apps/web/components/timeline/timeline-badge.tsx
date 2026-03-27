import type { HTMLAttributes } from "react";

export type TimelineBadgeVariant =
  | "neutral"
  | "contacted"
  | "signed"
  | "paid"
  | "scheduled"
  | "cancelled"
  | "reviewed"
  | "flagged";

const styles: Record<TimelineBadgeVariant, string> = {
  neutral: "border-slate-600 bg-slate-800/80 text-slate-200",
  contacted: "border-amber-700/60 bg-amber-950/50 text-amber-100",
  signed: "border-emerald-800/60 bg-emerald-950/40 text-emerald-100",
  paid: "border-sky-800/60 bg-sky-950/40 text-sky-100",
  scheduled: "border-violet-800/60 bg-violet-950/40 text-violet-100",
  cancelled: "border-red-900/60 bg-red-950/40 text-red-100",
  reviewed: "border-teal-800/60 bg-teal-950/40 text-teal-100",
  flagged: "border-orange-800/60 bg-orange-950/50 text-orange-100",
};

export function TimelineBadge({
  variant,
  children,
  className = "",
  ...rest
}: { variant: TimelineBadgeVariant; children: React.ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
