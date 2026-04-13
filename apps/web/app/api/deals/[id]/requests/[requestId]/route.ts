import { DealRequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { getDealRequest, patchDealRequest } from "@/modules/document-requests/document-request.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; requestId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId, requestId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  const row = await getDealRequest(dealId, requestId);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ request: row });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; requestId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId, requestId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? (body.status as DealRequestStatus) : undefined;
  const updated = await patchDealRequest(
    dealId,
    requestId,
    {
      status,
      title: typeof body.title === "string" ? body.title : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      dueAt: body.dueAt ? new Date(String(body.dueAt)) : undefined,
      blockedReason: typeof body.blockedReason === "string" ? body.blockedReason : undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
      brokerApprovedAt: body.brokerApprovedAt ? new Date(String(body.brokerApprovedAt)) : undefined,
    },
    userId
  );
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ request: updated });
}
