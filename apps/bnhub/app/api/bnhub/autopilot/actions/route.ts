import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { listBnhubAutopilotActionsForListing } from "@/modules/bnhub/autopilot/bnhub-autopilot-store.service";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!bnhubAutopilotExecutionFlags.autopilotV1) {
    return Response.json({ error: "feature_off" }, { status: 403 });
  }
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId")?.trim() ?? "";
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!row || row.ownerId !== uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const actions = listBnhubAutopilotActionsForListing(listingId);
  return Response.json({ actions });
}
