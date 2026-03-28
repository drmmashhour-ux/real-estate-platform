import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Subtle lift + gold border on hover */
  hoverable?: boolean;
  /** Gold border + soft outer glow */
  glow?: boolean;
};

export function Card({ children, className = "", hoverable = false, glow = false, ...rest }: CardProps) {
  const hover = hoverable ? "transition duration-200 ease-out hover:scale-[1.02] hover:border-premium-gold/35 hover:shadow-[0_0_32px_rgb(var(--premium-gold-channels) / 0.12)]" : "";
  const gl = glow ? "border-premium-gold/30 shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.12)]" : "border-white/10";
  return (
    <div
      className={`rounded-2xl border bg-[#121212] p-6 ${gl} ${hover} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
