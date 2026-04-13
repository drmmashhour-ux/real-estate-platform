"use client";

import type { ComponentPropsWithoutRef } from "react";
import { FunnelCtaAnchor } from "@/components/analytics/FunnelCtaAnchor";
import { fireContentPerformanceEvent } from "@/lib/content-machine/client-track";

type AnchorProps = ComponentPropsWithoutRef<typeof FunnelCtaAnchor>;

export function ContentPieceHeroReserve({
  contentPieceId,
  listingId,
  ...rest
}: AnchorProps & { contentPieceId?: string | null }) {
  return (
    <FunnelCtaAnchor
      {...rest}
      listingId={listingId}
      onClick={(e) => {
        rest.onClick?.(e);
        if (contentPieceId) {
          fireContentPerformanceEvent(contentPieceId, listingId, "click", { dedupeSession: true });
        }
      }}
    />
  );
}
