import type { ReactNode } from "react";

type Variant =
  | "default"
  | "gold"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  /** Part 11 — semantic status */
  | "verified"
  | "active"
  | "pending"
  | "highPriority"
  | "bestMatch"
  | "aiSuggested";

const styles: Record<Variant, string> = {
  default: "bg-white/10 text-white border border-white/10",
  gold: "bg-premium-gold/15 text-premium-gold border border-premium-gold/35",
  outline: "bg-transparent text-[#A1A1A1] border border-white/15",
  success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30",
  verified:
    "bg-emerald-500/12 text-emerald-200 border border-emerald-400/35 ring-1 ring-emerald-500/15",
  active: "bg-[#2E8B57]/18 text-emerald-100 border border-[#2E8B57]/35",
  pending: "bg-[#E0A800]/14 text-amber-100 border border-[#E0A800]/40",
  highPriority: "bg-[#C73E1D]/14 text-red-100 border border-[#C73E1D]/35 font-bold",
  bestMatch: "bg-premium-gold/20 text-premium-gold border border-premium-gold/45 shadow-sm shadow-premium-gold/10",
  aiSuggested:
    "bg-[#0B0B0B] text-premium-gold border border-premium-gold/50 ring-1 ring-premium-gold/25",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
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
