/**
 * PATCH /api/admin/deals/[id]/lead-link — Link or unlink Immo lead on a deal (admin).
 * Body: { leadId: string | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: dealId } = await params;
  let body: { leadId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadIdRaw = body.leadId;
  const leadId = leadIdRaw === null || leadIdRaw === "" ? null : String(leadIdRaw).trim();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, listingId: true, buyerId: true, leadId: true },
  });
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        listingId: true,
        userId: true,
        contactOrigin: true,
        commissionEligible: true,
        commissionSource: true,
      },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.listingId && deal.listingId && lead.listingId !== deal.listingId) {
      return NextResponse.json({ error: "Lead listing does not match deal listing" }, { status: 400 });
    }
    if (lead.userId && lead.userId !== deal.buyerId) {
      return NextResponse.json({ error: "Lead buyer does not match deal buyer" }, { status: 400 });
    }

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        leadId: lead.id,
        leadContactOrigin: lead.contactOrigin,
        commissionSource: lead.commissionSource ?? lead.contactOrigin,
        commissionEligible: lead.commissionEligible,
        possibleBypassFlag: false,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.leadContactAuditEvent
      .create({
        data: {
          leadId: lead.id,
          eventType: "admin_deal_lead_linked",
          actorUserId: adminId,
          listingId: deal.listingId,
          metadata: { dealId, leadId: lead.id } as object,
        },
      })
      .catch(() => {});

    return NextResponse.json(updated);
  }

  const prevLeadId = deal.leadId;
  const cleared = await prisma.deal.update({
    where: { id: dealId },
    data: {
      leadId: null,
      leadContactOrigin: null,
      commissionSource: null,
      commissionEligible: false,
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
    },
  });

  if (prevLeadId) {
    await prisma.leadContactAuditEvent
      .create({
        data: {
          leadId: prevLeadId,
          eventType: "admin_deal_lead_unlinked",
          actorUserId: adminId,
          listingId: deal.listingId,
          metadata: { dealId } as object,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(cleared);
}
