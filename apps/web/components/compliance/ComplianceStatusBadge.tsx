"use client";

type Props = {
  complete: boolean;
  /** When false, co-ownership rules do not apply — hide or show neutral */
  applies: boolean;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Co-ownership compliance status (not a legal opinion; internal workflow only).
 */
export function ComplianceStatusBadge({ complete, applies, className = "", size = "md" }: Props) {
  if (!applies) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 ${size === "sm" ? "text-xs" : "text-sm"} ${className}`}
      >
        N/A
      </span>
    );
  }

  if (complete) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-200 ${size === "sm" ? "text-xs" : "text-sm"} ${className}`}
      >
        Compliant
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-500/50 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-100 ${size === "sm" ? "text-xs" : "text-sm"} ${className}`}
    >
      Incomplete
    </span>
  );
}
