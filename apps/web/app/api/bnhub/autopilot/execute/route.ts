import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  executeApprovedBNHubActions,
  executeBnHubAutopilotAction,
} from "@/modules/bnhub/autopilot/bnhub-autopilot-execution.service";
import { getBnhubAutopilotAction } from "@/modules/bnhub/autopilot/bnhub-autopilot-store.service";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!bnhubAutopilotExecutionFlags.autopilotV1 || !bnhubAutopilotExecutionFlags.executionV1) {
    return Response.json({ error: "feature_off" }, { status: 403 });
  }
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    actionId?: unknown;
    listingId?: unknown;
    batch?: unknown;
  };

  if (body.batch === true && typeof body.listingId === "string") {
    const listingId = body.listingId.trim();
    const row = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!row || row.ownerId !== uid) return Response.json({ error: "Forbidden" }, { status: 403 });
    const r = await executeApprovedBNHubActions(listingId);
    return Response.json({ ok: true, ...r });
  }

  const actionId = typeof body.actionId === "string" ? body.actionId.trim() : "";
  if (!actionId) return Response.json({ error: "actionId or batch required" }, { status: 400 });

  const action = getBnhubAutopilotAction(actionId);
  if (!action) return Response.json({ error: "not_found" }, { status: 404 });

  const row = await prisma.shortTermListing.findUnique({
    where: { id: action.listingId },
    select: { ownerId: true },
  });
  if (!row || row.ownerId !== uid) return Response.json({ error: "Forbidden" }, { status: 403 });

  const r = await executeBnHubAutopilotAction(actionId);
  return Response.json(r);
}
