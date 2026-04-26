import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function brokerOrAdminWhere(
  viewerId: string,
  role: string | undefined
): Prisma.LeadWhereInput {
  if (role === "ADMIN") return {};
  return {
    OR: [
      { introducedByBrokerId: viewerId },
      { lastFollowUpByBrokerId: viewerId },
      { leadSource: "evaluation_lead" },
      { leadSource: "broker_consultation" },
    ],
  };
}

/** Rolling 30-day sales activity counts for the CRM assistant “Your performance”. */
export async function GET() {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = brokerOrAdminWhere(viewerId, viewer.role);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const idRows = await prisma.lead.findMany({
    where: base,
    select: { id: true },
    take: 8000,
  });
  const ids = idRows.map((r) => r.id);

  if (ids.length === 0) {
    return NextResponse.json({
      periodDays: 30,
      callsMade: 0,
      whatsappSent: 0,
      emailsSent: 0,
      meetingsBooked: 0,
      dealsClosed: 0,
    });
  }

  const whereEvents = {
    leadId: { in: ids },
    createdAt: { gte: since },
  };

  const [callsMade, whatsappSent, emailsSent, meetingsBooked, dealsClosed] = await Promise.all([
    prisma.leadTimelineEvent.count({
      where: { ...whereEvents, eventType: "sales_call_started" },
    }),
    prisma.leadTimelineEvent.count({
      where: { ...whereEvents, eventType: "sales_whatsapp_sent" },
    }),
    prisma.leadTimelineEvent.count({
      where: { ...whereEvents, eventType: "sales_email_sent" },
    }),
    prisma.leadTimelineEvent.count({
      where: { ...whereEvents, eventType: "sales_meeting_scheduled" },
    }),
    prisma.lead.count({
      where: {
        ...base,
        pipelineStatus: "won",
        dealClosedAt: { gte: since },
      },
    }),
  ]);

  return NextResponse.json({
    periodDays: 30,
    callsMade,
    whatsappSent,
    emailsSent,
    meetingsBooked,
    dealsClosed,
  });
}
