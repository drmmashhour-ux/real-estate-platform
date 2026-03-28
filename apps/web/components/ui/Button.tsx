import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-premium-gold text-premium-bg shadow-md shadow-premium-gold/25 hover:bg-premium-gold-hover focus-visible:ring-premium-gold",
  secondary:
    "border border-premium-gold/45 bg-transparent text-white hover:bg-premium-gold/10 focus-visible:ring-premium-gold/50",
  ghost:
    "text-white hover:bg-white/5 focus-visible:ring-white/25",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
};

const sizes: Record<Size, string> = {
  sm: "rounded-lg px-3 py-1.5 text-xs",
  md: "rounded-xl px-5 py-2.5 text-sm",
  lg: "rounded-xl px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-premium-bg",
        "disabled:pointer-events-none disabled:opacity-45",
        sizes[size],
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
