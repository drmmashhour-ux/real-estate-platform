import { trackEvent } from "@/src/services/analytics";

export type TrustAuditAction = "trust_badge_displayed" | "trust_oaciq_verify_click";

export type TrustAuditPayload = {
  action: TrustAuditAction;
  brokerUserId?: string | null;
  listingId?: string | null;
  dealId?: string | null;
  surface: "listing" | "profile" | "deal" | "contract" | "investor_packet" | "other";
  viewerUserId?: string | null;
};

/**
 * Product analytics for public trust surfaces — tagged [trust] for filtering.
 */
export async function recordTrustClientEvent(payload: TrustAuditPayload): Promise<void> {
  await trackEvent(
    payload.action,
    {
      domain: "[trust]",
      surface: payload.surface,
      brokerUserId: payload.brokerUserId ?? undefined,
      listingId: payload.listingId ?? undefined,
      dealId: payload.dealId ?? undefined,
    },
    { userId: payload.viewerUserId ?? undefined },
  );
}
