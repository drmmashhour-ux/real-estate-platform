import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Subtle lift + gold border on hover */
  hoverable?: boolean;
  /** Gold border + soft outer glow */
  glow?: boolean;
};

export function Card({ children, className = "", hoverable = false, glow = false, ...rest }: CardProps) {
  const base =
    "lecipm-transition rounded-2xl border bg-[#121212] p-[var(--lecipm-card-padding)]";
  const hover = hoverable
    ? "hover:-translate-y-0.5 hover:border-premium-gold/35 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
    : "";
  const gl = glow ? "border-premium-gold/30 shadow-[0_0_40px_rgb(var(--premium-gold-channels)_/_0.12)]" : "border-white/10";
  return (
    <div className={`${base} ${gl} ${hover} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
