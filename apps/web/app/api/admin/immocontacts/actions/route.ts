import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { IMMO_ADMIN_ACTIONS, recordImmoAdminAction, type ImmoAdminActionType } from "@/lib/immo/immo-contact-enforcement";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    leadId?: unknown;
    actionType?: unknown;
    reasonCode?: unknown;
    note?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  const actionType = typeof body.actionType === "string" ? body.actionType.trim() : "";
  const reasonCode = typeof body.reasonCode === "string" ? body.reasonCode.trim().slice(0, 120) : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 4000) : "";

  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  if (!IMMO_ADMIN_ACTIONS.includes(actionType as ImmoAdminActionType)) {
    return NextResponse.json({ error: "Invalid actionType" }, { status: 400 });
  }
  if (!reasonCode) return NextResponse.json({ error: "reasonCode is required" }, { status: 400 });
  if (!note) return NextResponse.json({ error: "note is required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      listingId: true,
      listingCode: true,
      userId: true,
      introducedByBrokerId: true,
      platformConversationId: true,
      contactOrigin: true,
    },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const listingKind = lead.listingCode ? "crm" : null;
  await recordImmoAdminAction({
    actorAdminId: adminId,
    actionType: actionType as ImmoAdminActionType,
    reasonCode,
    note,
    leadId: lead.id,
    listingId: lead.listingId,
    listingKind,
    buyerUserId: lead.userId,
    brokerId: lead.introducedByBrokerId,
    conversationId: lead.platformConversationId,
  });

  return NextResponse.json({ ok: true });
}
