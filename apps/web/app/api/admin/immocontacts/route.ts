/**
 * GET /api/admin/immocontacts — ImmoContact-origin leads (admin).
 */

import { NextResponse } from "next/server";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getImmoContactRestriction } from "@/lib/immo/immo-contact-enforcement";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leads = await prisma.lead.findMany({
    where: { contactOrigin: LeadContactOrigin.IMMO_CONTACT },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      listingId: true,
      listingCode: true,
      createdAt: true,
      firstPlatformContactAt: true,
      commissionEligible: true,
      commissionSource: true,
      userId: true,
      introducedByBrokerId: true,
      platformConversationId: true,
      deal: { select: { id: true, status: true, possibleBypassFlag: true, commissionSource: true } },
      introducedByBroker: { select: { id: true, name: true, email: true } },
    },
  });

  const enriched = await Promise.all(
    leads.map(async (lead) => {
      const restriction = await getImmoContactRestriction({
        listingId: lead.listingId,
        buyerUserId: lead.userId,
        brokerId: lead.introducedByBrokerId,
        leadId: lead.id,
      });
      const recentLogs = await prisma.immoContactLog.findMany({
        where: {
          OR: [
            { metadata: { path: ["leadId"], equals: lead.id } },
            ...(lead.listingId ? [{ listingId: lead.listingId }] : []),
            ...(lead.userId ? [{ userId: lead.userId }] : []),
            ...(lead.introducedByBrokerId ? [{ brokerId: lead.introducedByBrokerId }] : []),
          ],
        },
        orderBy: { actionAt: "desc" },
        take: 5,
        select: {
          id: true,
          contactType: true,
          hub: true,
          actionAt: true,
          adminNote: true,
          metadata: true,
        },
      });
      return {
        ...lead,
        activeRestriction: restriction.blocked ? restriction.reasons[0] ?? "Admin restriction active" : null,
        recentLogs: recentLogs.map((log) => {
          const metadata =
            log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};
          const eventType = typeof metadata.eventType === "string" ? metadata.eventType : log.contactType;
          const note = typeof metadata.note === "string" ? metadata.note : null;
          const reasonCode = typeof metadata.reasonCode === "string" ? metadata.reasonCode : null;
          const actionType = typeof metadata.actionType === "string" ? metadata.actionType : null;
          return {
            id: log.id,
            eventType,
            actionType,
            reasonCode,
            note,
            adminNote: log.adminNote,
            hub: log.hub,
            actionAt: log.actionAt.toISOString(),
          };
        }),
      };
    })
  );

  return NextResponse.json({ leads: enriched });
}
