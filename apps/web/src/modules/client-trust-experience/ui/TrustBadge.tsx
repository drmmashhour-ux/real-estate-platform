"use client";

import { TrustBadgeVariant } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";

export function TrustBadge({ variant }: { variant: TrustBadgeVariant }) {
  const styles: Record<TrustBadgeVariant, { label: string; className: string }> = {
    [TrustBadgeVariant.Verified]: {
      label: "Verified",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    },
    [TrustBadgeVariant.AttentionNeeded]: {
      label: "Attention needed",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-100",
    },
    [TrustBadgeVariant.NotReady]: {
      label: "Not ready",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-100",
    },
  };
  const s = styles[variant];
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${s.className}`}>
      {s.label}
    </span>
  );
}
