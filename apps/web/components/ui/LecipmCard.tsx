import type { HTMLAttributes, ReactNode } from "react";

type LecipmCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Disable hover border/glow (e.g. static panels). */
  staticSurface?: boolean;
};

/**
 * Canonical LECIPM card — dark surface, subtle gold on hover (see `.lecipm-card` in globals.css).
 */
export function LecipmCard({ className = "", staticSurface = false, children, ...rest }: LecipmCardProps) {
  return (
    <div
      className={["lecipm-card", staticSurface ? "lecipm-card-static" : "", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
