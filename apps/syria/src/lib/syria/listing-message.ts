import { prisma } from "@/lib/db";
import { onlyDigits } from "@/lib/syria-phone";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { recordSybnbEvent, SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { consumeListingMessageIpSlot } from "@/lib/syria/listing-message-ip-limit";
import { evaluateMessageSpamFollowUp } from "@/lib/syria/antispam-actions";

const MAX_MESSAGE = 4000;
const MAX_NAME = 120;

export type SubmitListingMessageInput = {
  listingId: string;
  name: string;
  phone?: string | null;
  message: string;
  utm?: { utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null };
  fromUserId?: string | null;
  /** When set, enforces ORDER SYBNB-97 per-IP daily message cap. */
  clientIp?: string | null;
};

export type SubmitListingMessageResult =
  | {
      ok: true;
      listingMessageId: string;
      inquiryId: string;
    }
  | {
      ok: false;
      error:
        | "validation"
        | "listing_unavailable"
        | "use_booking_flow"
        | "messages_disabled"
        | "rate_limit_messages";
    };

/**
 * ORDER SYBNB-95 — persist `ListingMessage` plus legacy `SyriaInquiry` row for analytics / follow-ups.
 */
export async function submitListingMessage(input: SubmitListingMessageInput): Promise<SubmitListingMessageResult> {
  const name = input.name.trim().slice(0, MAX_NAME);
  const message = input.message.trim().slice(0, MAX_MESSAGE);
  if (!name || !message) {
    return { ok: false, error: "validation" };
  }

  const digits = onlyDigits((input.phone ?? "").trim());
  const phoneStored = digits.length >= 8 ? digits : null;

  const property = await prisma.syriaProperty.findUnique({
    where: { id: input.listingId },
  });
  if (!property || property.status !== "PUBLISHED" || property.fraudFlag) {
    return { ok: false, error: "listing_unavailable" };
  }
  if (property.type === "BNHUB") {
    return { ok: false, error: "use_booking_flow" };
  }
  if (property.allowMessages === false) {
    return { ok: false, error: "messages_disabled" };
  }

  const ip = input.clientIp?.trim();
  if (ip && !consumeListingMessageIpSlot(ip)) {
    return { ok: false, error: "rate_limit_messages" };
  }

  const utm = input.utm ?? {};

  const rows = await prisma.$transaction([
    prisma.listingMessage.create({
      data: {
        listingId: input.listingId,
        senderName: name,
        senderPhone: phoneStored,
        message,
      },
    }),
    prisma.syriaInquiry.create({
      data: {
        propertyId: input.listingId,
        fromUserId: input.fromUserId ?? null,
        name,
        phone: phoneStored,
        message,
        utmSource: utm.utmSource ?? null,
        utmMedium: utm.utmMedium ?? null,
        utmCampaign: utm.utmCampaign ?? null,
      },
    }),
  ]);

  const listingMessageId = rows[0].id;
  const inquiryId = rows[1].id;

  if (process.env.NODE_ENV === "development") {
    console.log("[SYBNB-95 listing-message]", { listingMessageId, inquiryId, listingId: input.listingId });
  }

  await trackSyriaGrowthEvent({
    eventType: "message_sent",
    userId: input.fromUserId ?? null,
    propertyId: input.listingId,
    inquiryId,
    utm: {
      source: utm.utmSource ?? null,
      medium: utm.utmMedium ?? null,
      campaign: utm.utmCampaign ?? null,
    },
    payload: { listingMessageId },
  });

  await trackSyriaGrowthEvent({
    eventType: "inquiry_created",
    userId: input.fromUserId ?? null,
    propertyId: input.listingId,
    inquiryId,
    utm: {
      source: utm.utmSource ?? null,
      medium: utm.utmMedium ?? null,
      campaign: utm.utmCampaign ?? null,
    },
    payload: { name },
  });

  void recordSybnbEvent({
    type: SYBNB_ANALYTICS_EVENT_TYPES.GUEST_MESSAGE,
    listingId: input.listingId,
    userId: input.fromUserId ?? null,
    metadata: { inquiryId, listingMessageId, source: "syria_listing_message" },
  });

  void evaluateMessageSpamFollowUp(input.fromUserId);

  await revalidateSyriaPaths(`/listing/${input.listingId}`, "/admin/listing-messages");

  return {
    ok: true,
    listingMessageId,
    inquiryId,
  };
}
