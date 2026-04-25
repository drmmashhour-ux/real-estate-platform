import { NextRequest, NextResponse } from "next/server";
import { BnhubChannelPlatform, BnhubChannelSyncStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";
import { logChannelSync } from "@/lib/bnhub/channel-integration";

export const dynamic = "force-dynamic";

function parsePlatform(p: string): BnhubChannelPlatform | null {
  const u = p.toUpperCase().replace(/\./g, "_").replace(/-/g, "_");
  const map: Record<string, BnhubChannelPlatform> = {
    AIRBNB: BnhubChannelPlatform.AIRBNB,
    BOOKING: BnhubChannelPlatform.BOOKING_COM,
    BOOKING_COM: BnhubChannelPlatform.BOOKING_COM,
    VRBO: BnhubChannelPlatform.VRBO,
    EXPEDIA: BnhubChannelPlatform.EXPEDIA,
    TRIVAGO: BnhubChannelPlatform.TRIVAGO,
    HOTELS_COM: BnhubChannelPlatform.HOTELS_COM,
    HOTELS: BnhubChannelPlatform.HOTELS_COM,
    GOOGLE_HOTEL: BnhubChannelPlatform.GOOGLE_HOTEL,
    GOOGLE: BnhubChannelPlatform.GOOGLE_HOTEL,
    DIRECT: BnhubChannelPlatform.DIRECT,
    OTHER: BnhubChannelPlatform.OTHER,
  };
  return map[u] ?? null;
}

/** GET — current external mappings for this listing */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await params;
  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const rows = await prisma.bnhubExternalListingMapping.findMany({
    where: { listingId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ mappings: rows });
}

/**
 * PUT { platform: string, externalId: string }
 * Upsert BNHUB ↔ OTA property id (after AI parse or manual entry).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await params;
  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const body = (await request.json().catch(() => ({}))) as {
    platform?: string;
    externalId?: string;
  };
  const platform = typeof body.platform === "string" ? parsePlatform(body.platform) : null;
  const externalId = typeof body.externalId === "string" ? body.externalId.trim().slice(0, 500) : "";
  if (!platform) {
    return NextResponse.json({ error: "Invalid or missing platform" }, { status: 400 });
  }
  if (!externalId) {
    return NextResponse.json({ error: "externalId required" }, { status: 400 });
  }

  const row = await prisma.bnhubExternalListingMapping.upsert({
    where: { listingId_platform: { listingId, platform } },
    create: {
      listingId,
      platform,
      externalId,
      syncStatus: BnhubChannelSyncStatus.IDLE,
    },
    update: {
      externalId,
      syncStatus: BnhubChannelSyncStatus.IDLE,
      lastError: null,
    },
  });

  await logChannelSync({
    mappingId: row.id,
    listingId,
    platform,
    direction: "pull",
    status: "success",
    message: "External mapping upserted (host / AI-assisted)",
    payload: { platform, externalId },
  });

  return NextResponse.json({ mapping: row });
}
