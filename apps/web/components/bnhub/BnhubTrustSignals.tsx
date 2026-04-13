import { Shield } from "lucide-react";

const BADGE_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight shadow-sm";

const VARIANTS = {
  light: {
    wrap: "",
    badge: "border-emerald-200/90 bg-emerald-50/95 text-emerald-950",
    icon: "text-emerald-600",
  },
  sidebar: {
    wrap: "",
    badge: "border-neutral-200 bg-white text-slate-800",
    icon: "text-[#006ce4]",
  },
  formCompact: {
    wrap: "",
    badge: "border-neutral-200/90 bg-neutral-50 text-slate-700",
    icon: "text-emerald-600",
  },
  dark: {
    wrap: "",
    badge: "border-white/10 bg-slate-950/60 text-slate-200",
    icon: "text-emerald-400",
  },
} as const;

export type BnhubTrustSignalsVariant = keyof typeof VARIANTS;

/**
 * BNHub stay trust row — same three messages everywhere (listing, booking, checkout).
 * Small shield per badge for instant scan.
 */
export function BnhubTrustSignals({
  stripeCheckoutAvailable,
  variant = "light",
  className = "",
  id,
}: {
  stripeCheckoutAvailable: boolean;
  variant?: BnhubTrustSignalsVariant;
  className?: string;
  id?: string;
}) {
  const items: string[] = [
    "Free cancellation",
    stripeCheckoutAvailable ? "Secure checkout · Stripe" : "Secure booking · LECIPM",
    "No hidden fees",
  ];
  const v = VARIANTS[variant];

  return (
    <div
      id={id}
      className={`flex flex-wrap gap-2 ${v.wrap} ${className}`.trim()}
      role="group"
      aria-label="Trust and safety"
    >
      {items.map((label) => (
        <span key={label} className={`${BADGE_BASE} ${v.badge}`}>
          <Shield className={`h-3.5 w-3.5 shrink-0 ${v.icon}`} strokeWidth={2} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
