import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * LECIPM surface card — premium dark shell with soft shadow (matches brand mockups).
 */
export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-[#222222] bg-[#111111] p-6 shadow-lg shadow-black/50",
        "transition-all duration-200 hover:border-[#D4AF37]/25 hover:shadow-[0_0_36px_rgb(212_175_55_/_0.10)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
