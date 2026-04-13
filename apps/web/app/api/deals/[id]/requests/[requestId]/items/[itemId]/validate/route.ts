import { DealRequestItemStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { validateRequestItem } from "@/modules/document-intake-validation/request-item-validation.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; requestId: string; itemId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId, requestId, itemId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.closingRequestValidationV1) {
    return Response.json({ error: "Validation module disabled" }, { status: 403 });
  }

  let body: { status?: DealRequestItemStatus; sourceDocumentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.status || !Object.values(DealRequestItemStatus).includes(body.status)) {
    return Response.json({ error: "status required" }, { status: 400 });
  }

  const outcome = await validateRequestItem(dealId, requestId, itemId, {
    status: body.status,
    sourceDocumentId: body.sourceDocumentId,
    validatedByUserId: userId,
  });
  if (outcome === null) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ outcome });
}
