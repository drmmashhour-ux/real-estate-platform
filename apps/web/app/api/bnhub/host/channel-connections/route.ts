import { NextRequest } from "next/server";
import {
  BnhubChannelConnectionStatus,
  BnhubChannelConnectionType,
  BnhubChannelListingMapStatus,
  BnhubChannelPlatform,
} from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

function parsePlatform(p: string): BnhubChannelPlatform | null {
  const u = p.toUpperCase().replace(/\./g, "_");
  const map: Record<string, BnhubChannelPlatform> = {
    AIRBNB: BnhubChannelPlatform.AIRBNB,
    BOOKING: BnhubChannelPlatform.BOOKING_COM,
    BOOKING_COM: BnhubChannelPlatform.BOOKING_COM,
    VRBO: BnhubChannelPlatform.VRBO,
    EXPEDIA: BnhubChannelPlatform.EXPEDIA,
    DIRECT: BnhubChannelPlatform.DIRECT,
    OTHER: BnhubChannelPlatform.OTHER,
  };
  return map[u] ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const listingId = request.nextUrl.searchParams.get("listingId");

  const connections = await prisma.bnhubChannelConnection.findMany({
    where: {
      userId,
      ...(listingId ? { mappings: { some: { listingId } } } : {}),
    },
    include: {
      mappings: listingId ? { where: { listingId } } : true,
      syncLogs: { take: 5, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json({ connections });
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json()) as {
    listingId?: string;
    platform?: string;
    connectionType?: "ICAL" | "API";
    icalImportUrl?: string | null;
    externalListingRef?: string;
    syncFrequencyMinutes?: number;
  };

  if (!body.listingId || !body.platform) {
    return Response.json({ error: "listingId and platform required" }, { status: 400 });
  }
  const gate = await assertListingOwner(userId, body.listingId);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: gate.status });

  const platform = parsePlatform(body.platform);
  if (!platform) return Response.json({ error: "Invalid platform" }, { status: 400 });

  const connectionType =
    body.connectionType === "API" ? BnhubChannelConnectionType.API : BnhubChannelConnectionType.ICAL;

  const conn = await prisma.bnhubChannelConnection.create({
    data: {
      userId,
      platform,
      connectionType,
      icalImportUrl: body.icalImportUrl?.trim() || null,
      status: BnhubChannelConnectionStatus.ACTIVE,
      syncFrequencyMinutes: Math.min(1440, Math.max(5, body.syncFrequencyMinutes ?? 30)),
    },
  });

  await prisma.bnhubChannelListingMapping.create({
    data: {
      listingId: body.listingId,
      channelConnectionId: conn.id,
      externalListingRef: (body.externalListingRef ?? "ical-import").slice(0, 500),
      mappingStatus: BnhubChannelListingMapStatus.LINKED,
    },
  });

  const full = await prisma.bnhubChannelConnection.findUnique({
    where: { id: conn.id },
    include: { mappings: true, syncLogs: { take: 3, orderBy: { createdAt: "desc" } } },
  });

  return Response.json({ connection: full });
}
