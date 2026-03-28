import type { VerificationBadgeVariant } from "@/components/trust/VerificationBadge";

type Props = { variant: VerificationBadgeVariant };

/** “Verified by LECIPM” — shown when trust/verification tier is strong enough. */
export function LecipmVerifiedStrip({ variant }: Props) {
  if (variant !== "verified" && variant !== "high_trust") return null;
  return (
    <div className="rounded-xl border border-premium-gold/35 bg-[#0f0f0f] px-4 py-3 text-center text-xs font-medium text-premium-gold shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      Verified by LECIPM — trust and listing quality signals meet our display threshold.
    </div>
  );
}
