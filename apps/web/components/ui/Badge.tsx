import type { ReactNode } from "react";

type Variant = "default" | "gold" | "outline" | "success" | "warning" | "danger";

const styles: Record<Variant, string> = {
  default: "bg-white/10 text-white border border-white/10",
  gold: "bg-premium-gold/15 text-premium-gold border border-premium-gold/35",
  outline: "bg-transparent text-[#A1A1A1] border border-white/15",
  success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  /** Additional classes (e.g. w-fit) */
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
