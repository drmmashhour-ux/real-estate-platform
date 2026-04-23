import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--darlink-accent)] text-white hover:opacity-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--darlink-accent)]",
  secondary:
    "border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] text-[color:var(--darlink-text)] hover:bg-[color:var(--darlink-surface-muted)]",
  ghost:
    "text-[color:var(--darlink-text)] hover:bg-[color:var(--darlink-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--darlink-accent)]",
};

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--darlink-radius-xl)] px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
