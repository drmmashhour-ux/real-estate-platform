import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { exportBNHubCalendar } from "@/src/modules/bnhub-channel-manager";

export const dynamic = "force-dynamic";

/** Public iCal feed — requires `token` matching listing `channelIcalExportToken`. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return new Response("token required", { status: 401, headers: { "Content-Type": "text/plain" } });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { channelIcalExportToken: true, title: true },
  });
  if (!listing?.channelIcalExportToken || listing.channelIcalExportToken !== token) {
    return new Response("Forbidden", { status: 403, headers: { "Content-Type": "text/plain" } });
  }

  const ics = await exportBNHubCalendar(listingId);
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `attachment; filename="bnhub-${listingId}.ics"`,
    },
  });
}
