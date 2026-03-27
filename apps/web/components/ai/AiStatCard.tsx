"use client";

type AiStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "warning" | "success" | "muted";
};

export function AiStatCard({ title, value, subtitle, variant = "default" }: AiStatCardProps) {
  const valueClass =
    variant === "warning"
      ? "text-amber-400 dark:text-amber-400"
      : variant === "success"
        ? "text-emerald-500 dark:text-emerald-400"
        : variant === "muted"
          ? "text-slate-500 dark:text-slate-400"
          : "text-slate-900 dark:text-slate-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
      {subtitle != null && subtitle !== "" && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
