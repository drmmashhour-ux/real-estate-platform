import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

/** POST — generate or rotate iCal export secret; returns full export URL hint. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  const { listingId } = await params;
  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: gate.status });

  const token = randomBytes(24).toString("base64url");
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { channelIcalExportToken: token, externalSyncEnabled: true },
  });

  return Response.json({
    token,
    exportPath: `/api/bnhub/ical/export/${listingId}?token=${encodeURIComponent(token)}`,
  });
}
