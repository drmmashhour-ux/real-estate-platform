import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { ACQUISITION_DAILY_TARGETS } from "@/lib/client-acquisition/constants";
import { FIRST_TEN_DM_SCRIPTS, FIRST_TEN_CALL_FLOW, FIRST_TEN_FOLLOW_UP_SEQUENCE, FIRST_TEN_MOTIVATION } from "@/lib/client-acquisition/scripts";
import { getOrCreateTodayProgress } from "@/lib/client-acquisition/daily-progress";
import { requireAcquisitionAdmin } from "@/lib/client-acquisition/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAcquisitionAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = auth;

  const [leads, daily, messagesSent, replies, callsScheduled, clientsClosed] = await Promise.all([
    prisma.clientAcquisitionLead.findMany({
      where: { ownerId: userId },
      orderBy: [{ closed: "asc" }, { updatedAt: "desc" }],
    }),
    getOrCreateTodayProgress(userId),
    prisma.clientAcquisitionLead.count({ where: { ownerId: userId, messageSent: true } }),
    prisma.clientAcquisitionLead.count({ where: { ownerId: userId, replied: true } }),
    prisma.clientAcquisitionLead.count({ where: { ownerId: userId, callScheduled: true } }),
    prisma.clientAcquisitionLead.count({ where: { ownerId: userId, closed: true } }),
  ]);

  return NextResponse.json({
    targets: ACQUISITION_DAILY_TARGETS,
    daily: {
      ...daily,
      date: daily.date.toISOString(),
    },
    conversion: {
      messagesSent,
      replies,
      callsScheduled,
      clientsClosed,
    },
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      source: l.source,
      phone: l.phone,
      notes: l.notes,
      messageSent: l.messageSent,
      replied: l.replied,
      interested: l.interested,
      callScheduled: l.callScheduled,
      closed: l.closed,
      messageSentAt: l.messageSentAt?.toISOString() ?? null,
      repliedAt: l.repliedAt?.toISOString() ?? null,
      interestedAt: l.interestedAt?.toISOString() ?? null,
      callAt: l.callAt?.toISOString() ?? null,
      closedAt: l.closedAt?.toISOString() ?? null,
      serviceType: l.serviceType,
      valueCents: l.valueCents,
      revenueCents: l.revenueCents,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    scripts: {
      dm: FIRST_TEN_DM_SCRIPTS,
      callFlow: FIRST_TEN_CALL_FLOW,
      followUp: FIRST_TEN_FOLLOW_UP_SEQUENCE,
      motivation: FIRST_TEN_MOTIVATION,
    },
  });
}
