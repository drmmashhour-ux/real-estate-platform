import type { NextRequest } from "next/server";
import {
  BnhubChannelConnectionStatus,
  BnhubChannelConnectionType,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { syncAvailability } from "@/modules/channel-manager/channel-sync.service";
import { syncAllConnections, syncConnection } from "@/src/modules/bnhub-channel-manager";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/channel/sync — ICS/iCal pull (OTA → BNHub) then availability push (BNHub → OTAs).
 * Authorization: Bearer $CRON_SECRET (same pattern as `/api/cron/*`).
 */
function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return !!(secret && token === secret);
}

async function runSync(request: NextRequest): Promise<Response> {
  /** When true, imports every ICS feed regardless of `syncFrequencyMinutes` (use sparingly). */
  const forceIcs =
    request.nextUrl.searchParams.get("forceIcs") === "1" ||
    request.nextUrl.searchParams.get("forceIcs") === "true";

  let icsProcessed = 0;
  let icsErrors = 0;
  if (forceIcs) {
    const connections = await prisma.bnhubChannelConnection.findMany({
      where: {
        connectionType: BnhubChannelConnectionType.ICAL,
        icalImportUrl: { not: null },
        status: BnhubChannelConnectionStatus.ACTIVE,
      },
      select: { id: true },
    });
    for (const c of connections) {
      icsProcessed += 1;
      const r = await syncConnection(c.id);
      if (!r.ok) icsErrors += 1;
    }
  } else {
    const ics = await syncAllConnections();
    icsProcessed = ics.processed;
    icsErrors = ics.errors;
  }

  const [mappingListings, externalMapped] = await Promise.all([
    prisma.bnhubChannelListingMapping.findMany({
      distinct: ["listingId"],
      select: { listingId: true },
    }),
    prisma.bnhubExternalListingMapping.findMany({
      distinct: ["listingId"],
      select: { listingId: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const r of mappingListings) ids.add(r.listingId);
  for (const r of externalMapped) ids.add(r.listingId);

  let failures = 0;
  for (const listingId of ids) {
    try {
      await syncAvailability(listingId);
    } catch {
      failures += 1;
    }
  }

  return Response.json({
    success: true,
    ics: {
      pulledConnections: icsProcessed,
      pullErrors: icsErrors,
      forcedAllFeeds: forceIcs,
    },
    push: {
      syncedListingCount: ids.size,
      failures,
    },
  });
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runSync(request);
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runSync(request);
}
