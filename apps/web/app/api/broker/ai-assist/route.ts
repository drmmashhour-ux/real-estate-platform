import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { aiAutopilotMessagingAssistFlags, brokerAiAssistFlags, brokerClosingFlags } from "@/config/feature-flags";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";
import { buildLeadClosingStateFromLeadRecord } from "@/modules/broker/closing/broker-closing-state.service";
import { buildBrokerAiAssistSummary } from "@/modules/broker/ai-assist/broker-ai-assist.service";
import { buildBrokerAiDailyAssist } from "@/modules/broker/ai-assist/broker-ai-daily-assist.service";
import { computeNextBestAction } from "@/modules/broker/closing/broker-next-action.service";

export const dynamic = "force-dynamic";

function leadSelect() {
  return {
    id: true,
    name: true,
    score: true,
    aiExplanation: true,
    lastContactedAt: true,
    firstContactAt: true,
    pipelineStage: true,
    pipelineStatus: true,
    wonAt: true,
    lostAt: true,
    dmStatus: true,
    createdAt: true,
    contactUnlockedAt: true,
    introducedByBrokerId: true,
    lastFollowUpByBrokerId: true,
    leadSource: true,
  } as const;
}

/** GET ?leadId= optional — assist summary for one lead, or daily prioritization when omitted */
export async function GET(req: Request) {
  if (!brokerAiAssistFlags.brokerAiAssistV1 || !brokerClosingFlags.brokerClosingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = user.role;

  const url = new URL(req.url);
  const rawLeadId = url.searchParams.get("leadId");
  const leadId = typeof rawLeadId === "string" ? rawLeadId.trim() : "";

  const nowMs = Date.now();
  const messagingAssistEnabled = aiAutopilotMessagingAssistFlags.messagingAssistV1;

  if (leadId) {
    const l = await prisma.lead.findFirst({
      where: {
        id: leadId,
        OR: [
          { introducedByBrokerId: userId },
          { lastFollowUpByBrokerId: userId },
          { leadSource: { in: ["evaluation_lead", "broker_consultation"] } },
        ],
      },
      select: leadSelect(),
    });

    if (!l || !canBrokerOrAdminAccessLead(role, userId, l)) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const closing = buildLeadClosingStateFromLeadRecord(l.id, userId, l);
    const nextAction = computeNextBestAction({
      state: closing,
      contactUnlockedAt: l.contactUnlockedAt?.toISOString() ?? null,
      nowMs,
    });

    const assist = buildBrokerAiAssistSummary({
      leadId: l.id,
      name: l.name,
      score: l.score,
      closing,
      nextAction,
      nowMs,
    });

    return NextResponse.json({ assist, messagingAssistEnabled });
  }

  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { introducedByBrokerId: userId },
        { lastFollowUpByBrokerId: userId },
        { leadSource: { in: ["evaluation_lead", "broker_consultation"] } },
      ],
    },
    select: leadSelect(),
    take: 80,
    orderBy: { updatedAt: "desc" },
  });

  const rows = leads
    .filter((l) => canBrokerOrAdminAccessLead(role, userId, l))
    .map((l) => {
      const closing = buildLeadClosingStateFromLeadRecord(l.id, userId, l);
      const nextAction = computeNextBestAction({
        state: closing,
        contactUnlockedAt: l.contactUnlockedAt?.toISOString() ?? null,
        nowMs,
      });
      return {
        leadId: l.id,
        name: l.name,
        score: l.score,
        closing,
        nextAction,
      };
    });

  const daily = buildBrokerAiDailyAssist(rows, nowMs);

  return NextResponse.json({ daily, messagingAssistEnabled });
}
