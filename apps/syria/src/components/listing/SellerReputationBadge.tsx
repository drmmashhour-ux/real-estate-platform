import type { UserReputationTier } from "@/lib/syria/user-reputation";

/** ORDER SYBNB-98 — seller reputation label beside host name on listing detail. */
export function SellerReputationBadge({ tier, label }: { tier: UserReputationTier; label: string }) {
  const tone =
    tier === "star"
      ? "bg-amber-100/95 text-amber-950 ring-amber-400/40"
      : tier === "trusted"
        ? "bg-emerald-50 text-emerald-900 ring-emerald-300/50"
        : "bg-[color:var(--darlink-surface-muted)] text-[color:var(--darlink-text-muted)] ring-[color:var(--darlink-border)]";
  return (
    <span
      className={`inline-flex max-w-full shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}
