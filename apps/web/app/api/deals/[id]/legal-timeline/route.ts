import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEAL_LEGAL_ACTIONS, recordDealLegalAction, getDealLegalTimeline, type DealLegalAction } from "@/lib/deals/legal-timeline";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;

  const deal = await prisma.deal.findFirst({
    where: { id, OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }] },
    select: { id: true },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const timeline = await getDealLegalTimeline(id);
  return Response.json({ timeline });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;

  const deal = await prisma.deal.findFirst({
    where: { id, OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }] },
    select: { id: true, brokerId: true },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const canEdit = viewer?.role === "ADMIN" || viewer?.role === "BROKER" || deal.brokerId === userId;
  if (!canEdit) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { action?: unknown; note?: unknown; documentIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 4000) : "";
  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  if (!DEAL_LEGAL_ACTIONS.includes(action as DealLegalAction)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const timeline = await recordDealLegalAction({
    dealId: id,
    actorUserId: userId,
    action: action as DealLegalAction,
    note: note || null,
    documentIds,
  });
  return Response.json({ ok: true, timeline });
}
