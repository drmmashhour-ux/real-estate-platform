import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildBNHubAutopilotActions } from "@/modules/bnhub/autopilot/bnhub-autopilot-actions.builder";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!bnhubAutopilotExecutionFlags.autopilotV1) {
    return Response.json({ error: "feature_off" }, { status: 403 });
  }
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { listingId?: unknown };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!row || row.ownerId !== uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const actions = await buildBNHubAutopilotActions(listingId);
  return Response.json({ ok: true, actions });
}
