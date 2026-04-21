import type { ReactNode } from "react";

export function MockCard({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft transition-all duration-200 ${glow ? "shadow-ds-glow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function MockButton({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200";
  const styles =
    variant === "primary"
      ? "bg-ds-gold text-black shadow-[0_0_0_1px_rgba(212,175,55,0.35)] hover:bg-premium-gold-hover hover:shadow-[0_0_28px_rgba(212,175,55,0.35)]"
      : "border border-ds-border bg-transparent text-ds-text hover:border-ds-gold/50 hover:text-ds-gold";
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function MockBadge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "muted";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        tone === "gold"
          ? "border-ds-gold/40 bg-ds-gold/10 text-ds-gold"
          : "border-ds-border bg-ds-surface text-ds-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}

export function MockKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <MockCard className="hover:border-ds-gold/35 hover:shadow-[0_0_32px_rgba(212,175,55,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ds-text-secondary">{hint}</p> : null}
    </MockCard>
  );
}
