import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordSybnbEvent } from "@/lib/sybnb/sybnb-analytics-events";
import { logTimelineEvent } from "@/lib/timeline/log-event";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listing_view"),
    listingId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("contact_click"),
    listingId: z.string().min(1).max(64),
    channel: z.enum(["whatsapp", "tel"]),
  }),
]);

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

/** SYBNB-10/`listing_view`, SYBNB-11/`contact_click` ingestion. Others emit server-side only. */
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
