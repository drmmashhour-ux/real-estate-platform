import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { pushAvailabilityToChannels } from "@/lib/bnhub/channel-integration";

export const dynamic = "force-dynamic";

/** Toggle external OTA sync for a BNHUB listing (host-only). */
export async function PATCH(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { listingId?: string; externalSyncEnabled?: boolean };
  try {
    body = (await req.json()) as { listingId?: string; externalSyncEnabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  if (typeof body.externalSyncEnabled !== "boolean") {
    return NextResponse.json({ error: "externalSyncEnabled boolean required" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { externalSyncEnabled: body.externalSyncEnabled },
  });

  if (body.externalSyncEnabled) {
    void pushAvailabilityToChannels(listingId).catch(() => {});
  }

  return NextResponse.json({ ok: true, externalSyncEnabled: body.externalSyncEnabled });
}
