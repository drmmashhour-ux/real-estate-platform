import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";

export const SYBNB_ANALYTICS_EVENT_TYPES = {
  LISTING_VIEW: "listing_view",
  /** ORDER SYBNB-70 — Hadiah listing detail (`/listing/[id]`) open beacon (marketplace + mixed surfaces). */
  LISTING_OPEN: "listing_open",
  BOOKING_REQUEST: "booking_request",
  BOOKING_APPROVED: "booking_approved",
  REPORT_SUBMITTED: "report_submitted",
  CONTACT_CLICK: "contact_click",
  /** ORDER SYBNB-85 — Guest tapped “Show phone” on listing trust panel (intent before WhatsApp/tel). */
  PHONE_REVEAL: "phone_reveal",
  /** SYBNB-40 — WhatsApp / phone taps on `HOTEL` listings (lead-first, no booking flow). */
  HOTEL_CONTACT_CLICK: "hotel_contact_click",
  /** ORDER SYBNB-70 — inquiry form submitted (`SyriaInquiry` created). */
  GUEST_MESSAGE: "guest_message",
} as const;

export type SybnbAnalyticsCanonicalType = (typeof SYBNB_ANALYTICS_EVENT_TYPES)[keyof typeof SYBNB_ANALYTICS_EVENT_TYPES];

/**
 * Stores a SYBNB analytics row (`SybnbEvent`). Prefer server contexts; `listing_view` may also POST via `/api/sybnb/events`.
 */
export async function recordSybnbEvent(input: {
  type: SybnbAnalyticsCanonicalType | string;
  listingId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = coerceMetadataJson(input.metadata);
  try {
    await prisma.sybnbEvent.create({
      data: {
        type: input.type.trim().slice(0, 96),
        listingId: input.listingId?.trim() || null,
        userId: input.userId?.trim() || null,
        metadata,
      },
    });
  } catch (e) {
    console.warn("[sybnb-analytics] record failed", e);
  }
}

function coerceMetadataJson(metadata?: Record<string, unknown>): Prisma.InputJsonValue {
  if (!metadata || typeof metadata !== "object") {
    return {} as unknown as Prisma.InputJsonValue;
  }
  try {
    const s = JSON.stringify(metadata);
    if (s.length > 8000) {
      return { truncated: true } as unknown as Prisma.InputJsonValue;
    }
    return JSON.parse(s) as Prisma.InputJsonValue;
  } catch {
    return {} as unknown as Prisma.InputJsonValue;
  }
}
