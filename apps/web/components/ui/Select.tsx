import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Matches Input `dark` shell — black/gold system */
  variant?: "ds";
};

export function Select({ className = "", variant, children, ...props }: SelectProps) {
  const ds =
    variant === "ds"
      ? "border-ds-border bg-ds-card text-ds-text placeholder:text-ds-text-secondary focus-visible:ring-ds-gold/50 focus-visible:ring-offset-ds-bg"
      : "";
  return (
    <select
      className={[
        "w-full appearance-none rounded-xl border px-4 py-2.5 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        ds || "border-white/15 bg-[#111111] text-white focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-[#0B0B0B]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}
