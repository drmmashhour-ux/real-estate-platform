import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "stat" | "action" | "alert" | "residence" | "dashboardPanel";

const variantShell: Record<CardVariant, string> = {
  default: "border-white/10 bg-[#121212]",
  stat: "border-white/10 bg-gradient-to-br from-[#151515] to-[#121212]",
  action: "border-premium-gold/20 bg-[#121212] hover:border-premium-gold/35",
  alert: "border-amber-500/25 bg-amber-500/[0.06]",
  residence: "border-white/10 bg-[#FAFAF7] text-[#0B0B0B]",
  dashboardPanel: "border-[#D9D9D2]/80 bg-white text-[#0B0B0B] shadow-[var(--ds-shadow-card)]",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
  /** Subtle lift + gold border on hover */
  hoverable?: boolean;
  /** Gold border + soft outer glow (dark surfaces) */
  glow?: boolean;
};

export function Card({
  children,
  className = "",
  variant = "default",
  hoverable = false,
  glow = false,
  ...rest
}: CardProps) {
  const base =
    variant === "residence" || variant === "dashboardPanel"
      ? "lecipm-transition rounded-[var(--ds-radius-xl)] border p-5 sm:p-6"
      : "lecipm-transition rounded-[var(--ds-radius-xl)] border p-[var(--lecipm-card-padding,1.25rem)] sm:p-6";

  const hover =
    hoverable ?
      "hover:-translate-y-0.5 hover:shadow-[var(--ds-shadow-card-hover)] motion-reduce:hover:translate-y-0 ds-card-lift"
    : "";

  const gl =
    glow ?
      "border-premium-gold/30 shadow-[0_0_40px_rgb(var(--premium-gold-channels)_/_0.12)]"
    : variantShell[variant];

  return (
    <div className={`${base} ${gl} ${hover} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
