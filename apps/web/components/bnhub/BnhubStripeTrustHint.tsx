import { Shield } from "lucide-react";

/**
 * BNHub copy reinforcing Stripe-backed checkout (listing, booking, etc.).
 * `prominent` — high-visibility strip for booking confidence.
 */
export function BnhubStripeTrustHint({
  className = "",
  variant = "compact",
  tone = "dark",
}: {
  className?: string;
  variant?: "compact" | "prominent";
  /** `light` for pale listing pages; `dark` for BNHUB black/gold surfaces. */
  tone?: "dark" | "light";
}) {
  if (variant === "prominent") {
    const shell =
      tone === "light"
        ? "border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80"
        : "border-emerald-500/30 bg-emerald-950/40 ring-1 ring-emerald-500/15";
    const titleCls = tone === "light" ? "text-slate-900" : "text-emerald-50";
    const bodyCls = tone === "light" ? "text-slate-600" : "text-emerald-100/85";
    const iconCls = tone === "light" ? "text-[#635BFF]" : "text-emerald-300";
    return (
      <div className={`rounded-xl px-4 py-3 ${shell} ${className}`} role="note">
        <div className="flex items-start gap-3">
          <Shield className={`mt-0.5 h-5 w-5 shrink-0 ${iconCls}`} strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className={`text-sm font-semibold tracking-tight ${titleCls}`}>
              Secure payments powered by{" "}
              <span className={tone === "light" ? "text-[#635BFF]" : "text-white"}>Stripe</span>
            </p>
            <p className={`mt-1 text-xs leading-snug ${bodyCls}`}>
              Card details are entered on Stripe&apos;s secure checkout page. LECIPM never stores your full card number.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p
      className={`flex items-start gap-2 text-xs leading-snug text-slate-500 ${className}`}
      role="note"
    >
      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80" strokeWidth={2} aria-hidden />
      <span>
        <span className="font-medium text-slate-400">Secure payments powered by Stripe</span>
        {" — "}
        card details are entered on Stripe&apos;s secure page; LECIPM never stores your full card number.
      </span>
    </p>
  );
}
