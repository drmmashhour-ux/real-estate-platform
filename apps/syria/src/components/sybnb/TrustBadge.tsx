"use client";

import { useTranslations } from "next-intl";

/**
 * Public trust band for listings/chat/bookings — tier labels only (no numeric score or internal fraud signals).
 */
export function TrustBadge({ trustScore, className = "" }: { trustScore: number; className?: string }) {
  const t = useTranslations("Sybnb.trust");
  const tier = trustScore >= 80 ? "trusted" : trustScore >= 50 ? "normal" : "low";
  const emoji = tier === "trusted" ? "🟢" : tier === "normal" ? "🟡" : "🔴";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-neutral-200/90 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 ${className}`.trim()}
    >
      <span aria-hidden>{emoji}</span>
      <span>{t(tier)}</span>
    </span>
  );
}
