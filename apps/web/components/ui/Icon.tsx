import type { LucideIcon } from "lucide-react";

const sizePx = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof sizePx;

type Props = {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  /** Lucide stroke width */
  strokeWidth?: number;
};

/**
 * Lucide icons with consistent sizing and default stroke (tint via `className`, e.g. `text-premium-gold`).
 */
export function Icon({ icon: Lucide, size = "md", className = "", strokeWidth = 1.75 }: Props) {
  const px = sizePx[size];
  return (
    <Lucide
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      className={`shrink-0 text-current ${className}`.trim()}
      aria-hidden
    />
  );
}
