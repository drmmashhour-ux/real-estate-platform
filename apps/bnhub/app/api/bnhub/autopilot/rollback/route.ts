import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { rollbackBNHubAction } from "@/modules/bnhub/autopilot/bnhub-autopilot-rollback.service";
import { getBnhubAutopilotAction } from "@/modules/bnhub/autopilot/bnhub-autopilot-store.service";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!bnhubAutopilotExecutionFlags.autopilotV1 || !bnhubAutopilotExecutionFlags.rollbackV1) {
    return Response.json({ error: "feature_off" }, { status: 403 });
  }
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { actionId?: unknown };
  const actionId = typeof body.actionId === "string" ? body.actionId.trim() : "";
  if (!actionId) return Response.json({ error: "actionId required" }, { status: 400 });

  const action = getBnhubAutopilotAction(actionId);
  if (!action) return Response.json({ error: "not_found" }, { status: 404 });

  const row = await prisma.shortTermListing.findUnique({
    where: { id: action.listingId },
    select: { ownerId: true },
  });
  if (!row || row.ownerId !== uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const r = await rollbackBNHubAction(actionId);
  return Response.json(r);
}
