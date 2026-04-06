"use client";

import { ShareListingActions } from "@/components/sharing/ShareListingActions";

export function ViralShareCallout({
  shareTitle,
  visible,
  className = "",
  listingAnalytics,
}: {
  shareTitle: string;
  visible: boolean;
  className?: string;
  listingAnalytics?: { kind: "FSBO" | "CRM"; listingId: string };
}) {
  if (!visible) return null;
  return (
    <div
      className={`rounded-xl border border-premium-gold/25 bg-premium-gold/[0.07] p-4 ${className}`.trim()}
      role="status"
    >
      <p className="text-sm font-semibold text-white">Share with a friend</p>
      <p className="mt-1 text-xs text-white/65">Know someone browsing this market? Send them the link.</p>
      <ShareListingActions
        shareTitle={shareTitle}
        variant="compact"
        className="mt-3"
        listingAnalytics={listingAnalytics}
      />
    </div>
  );
}
