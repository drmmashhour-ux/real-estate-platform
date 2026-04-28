import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { recordSybnbEvent, SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";
import { logTimelineEvent } from "@/lib/timeline/log-event";
import { recordListingPhoneRevealForAntispam } from "@/lib/syria/phone-reveal-antispam";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listing_view"),
    listingId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("listing_open"),
    listingId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("phone_reveal"),
    listingId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("contact_click"),
    listingId: z.string().min(1).max(64),
    channel: z.enum(["whatsapp", "tel"]),
  }),
  z.object({
    type: z.literal("hotel_contact_click"),
    listingId: z.string().min(1).max(64),
    channel: z.enum(["whatsapp", "tel"]),
  }),
]);

async function assertPublishedListingForGuestSignals(listingId: string): Promise<boolean> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: listingId },
    select: { id: true, status: true, fraudFlag: true },
  });
  return Boolean(listing?.status === "PUBLISHED" && !listing.fraudFlag);
}

async function assertStayListingForView(listingId: string): Promise<boolean> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: listingId },
    select: { id: true, category: true, status: true, sybnbReview: true, fraudFlag: true },
  });
  return (
    Boolean(listing) &&
    listing!.category === "stay" &&
    listing!.status === "PUBLISHED" &&
    !listing!.fraudFlag &&
    listing!.sybnbReview === "APPROVED"
  );
}

async function assertListingForContactClick(listingId: string): Promise<boolean> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: listingId },
    select: { id: true, status: true, fraudFlag: true },
  });
  return Boolean(listing?.id && listing.status === "PUBLISHED" && !listing.fraudFlag);
}

async function assertHotelListingForLead(listingId: string): Promise<boolean> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: listingId },
    select: { id: true, status: true, fraudFlag: true, type: true },
  });
  return Boolean(listing?.id && listing.status === "PUBLISHED" && !listing.fraudFlag && listing.type === "HOTEL");
}

/** SYBNB-10/`listing_view`, SYBNB-40/`hotel_contact_click`, SYBNB-70/`listing_open` + `contact_click`, SYBNB-85/`phone_reveal` ingestion. Others emit server-side only. */
export async function POST(req: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  if (payload.type === "listing_open") {
    const okOpen = await assertPublishedListingForGuestSignals(payload.listingId);
    if (!okOpen) {
      return NextResponse.json({ ok: false, error: "listing_unavailable" }, { status: 404 });
    }
    const session = await getSessionUser();
    await recordSybnbEvent({
      type: "listing_open",
      listingId: payload.listingId,
      userId: session?.id ?? null,
      metadata: { source: "listing_detail_beacon" },
    });
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "listing_view") {
    const ok = await assertStayListingForView(payload.listingId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "listing_unavailable" }, { status: 404 });
    }
    const session = await getSessionUser();
    await recordSybnbEvent({
      type: "listing_view",
      listingId: payload.listingId,
      userId: session?.id ?? null,
      metadata: { source: "api" },
    });
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "phone_reveal") {
    const okReveal = await assertListingForContactClick(payload.listingId);
    if (!okReveal) {
      return NextResponse.json({ ok: false, error: "listing_unavailable" }, { status: 404 });
    }
    const session = await getSessionUser();
    await recordSybnbEvent({
      type: SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL,
      listingId: payload.listingId,
      userId: session?.id ?? null,
      metadata: { source: "listing_show_phone" },
    });
    void trackSyriaGrowthEvent({
      eventType: "phone_reveal",
      propertyId: payload.listingId,
      userId: session?.id ?? null,
      payload: { source: "listing_show_phone" },
    });
    void recordListingPhoneRevealForAntispam(payload.listingId);
    void recomputeSy8FeedRankForPropertyId(payload.listingId);
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "hotel_contact_click") {
    const okHotel = await assertHotelListingForLead(payload.listingId);
    if (!okHotel) {
      return NextResponse.json({ ok: false, error: "listing_unavailable" }, { status: 404 });
    }
    const session = await getSessionUser();
    await recordSybnbEvent({
      type: "hotel_contact_click",
      listingId: payload.listingId,
      userId: session?.id ?? null,
      metadata: { channel: payload.channel },
    });
    void logTimelineEvent({
      entityType: "syria_property",
      entityId: payload.listingId,
      action: "sybnb_hotel_contact_channel_used",
      actorId: session?.id ?? undefined,
      actorRole: session ? "user" : "visitor",
      metadata: { channel: payload.channel },
    });
    return NextResponse.json({ ok: true });
  }

  const okContact = await assertListingForContactClick(payload.listingId);
  if (!okContact) {
    return NextResponse.json({ ok: false, error: "listing_unavailable" }, { status: 404 });
  }
  const session = await getSessionUser();
  await recordSybnbEvent({
    type: "contact_click",
    listingId: payload.listingId,
    userId: session?.id ?? null,
    metadata: { channel: payload.channel },
  });
  void logTimelineEvent({
    entityType: "syria_property",
    entityId: payload.listingId,
    action: "sybnb_contact_channel_used",
    actorId: session?.id ?? undefined,
    actorRole: session ? "user" : "visitor",
    metadata: { channel: payload.channel },
  });
  return NextResponse.json({ ok: true });
}
