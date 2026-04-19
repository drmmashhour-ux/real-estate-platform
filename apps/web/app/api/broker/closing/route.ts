import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { aiAutopilotMessagingAssistFlags, brokerClosingFlags } from "@/config/feature-flags";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";
import { buildBrokerDealSummary } from "@/modules/broker/closing/broker-deal-summary.service";
import { buildLeadClosingStateFromLeadRecord } from "@/modules/broker/closing/broker-closing-state.service";
import { buildFollowUpSuggestions } from "@/modules/broker/closing/broker-followup.service";
import { computeResponseSpeedScore } from "@/modules/broker/closing/broker-response.service";
import {
  computeDailyStripCounts,
  computeNextBestAction,
  computeTopThreeToClose,
} from "@/modules/broker/closing/broker-next-action.service";
import {
  markLeadContacted,
  markLeadResponded,
  updateLeadStage,
} from "@/modules/broker/closing/broker-closing-state.service";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import {
  recordFollowUpsGeneratedMonitored,
  recordNextActionsComputedMonitored,
  recordQuickActionUsedMonitored,
  recordTopThreeGeneratedMonitored,
} from "@/modules/broker/closing/broker-closing-monitoring.service";

export const dynamic = "force-dynamic";

const ALLOWED_STAGES: LeadClosingStage[] = [
  "new",
  "contacted",
  "responded",
  "meeting_scheduled",
  "negotiation",
  "closed_won",
  "closed_lost",
];

function isStage(s: unknown): s is LeadClosingStage {
  return typeof s === "string" && (ALLOWED_STAGES as string[]).includes(s);
}

/** GET — deal summary + pipeline items for the signed-in broker (or admin). */
export async function GET() {
  if (!brokerClosingFlags.brokerClosingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await buildBrokerDealSummary(userId);
  if (!summary) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nowMs = Date.now();
  const messagingAssistEnabled = aiAutopilotMessagingAssistFlags.messagingAssistV1;

  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { introducedByBrokerId: userId },
        { lastFollowUpByBrokerId: userId },
        { leadSource: { in: ["evaluation_lead", "broker_consultation"] } },
      ],
    },
    select: {
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
    },
    take: 80,
    orderBy: { updatedAt: "desc" },
  });

  const items = leads
    .filter((l) => canBrokerOrAdminAccessLead(user.role, userId, l))
    .map((l) => {
      const closing = buildLeadClosingStateFromLeadRecord(l.id, userId, l);
      const suggestions = buildFollowUpSuggestions({
        state: closing,
        contactUnlockedAt: l.contactUnlockedAt?.toISOString() ?? null,
        nowMs,
      });
      const responseSpeed = computeResponseSpeedScore({
        state: closing,
        contactUnlockedAt: l.contactUnlockedAt?.toISOString() ?? null,
        firstContactAt: l.firstContactAt?.toISOString() ?? null,
      });
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
        suggestions,
        responseSpeed,
        nextAction,
        contactUnlockedAt: l.contactUnlockedAt?.toISOString() ?? null,
        firstContactAt: l.firstContactAt?.toISOString() ?? null,
      };
    });

  const suggestionCount = items.reduce((acc, row) => acc + row.suggestions.length, 0);
  recordFollowUpsGeneratedMonitored(suggestionCount);
  recordNextActionsComputedMonitored(items.length);

  const dailyStrip = computeDailyStripCounts(
    items.map((row) => ({
      closing: row.closing,
      nextAction: row.nextAction,
      score: row.score,
    })),
    nowMs,
  );

  const topThreeToClose = computeTopThreeToClose(
    items.map((row) => ({
      leadId: row.leadId,
      name: row.name,
      score: row.score,
      closing: row.closing,
      nextAction: row.nextAction,
    })),
  );
  recordTopThreeGeneratedMonitored();

  return NextResponse.json({ summary, items, dailyStrip, topThreeToClose, messagingAssistEnabled });
}

/** PATCH — { leadId, action: "set_stage" | "contacted" | "responded", stage? } */
export async function PATCH(req: Request) {
  if (!brokerClosingFlags.brokerClosingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { leadId?: unknown; action?: unknown; stage?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const action = typeof body.action === "string" ? body.action : "";

  if (action === "contacted") {
    const r = await markLeadContacted(leadId, userId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    if (r.applied) recordQuickActionUsedMonitored("contacted");
    return NextResponse.json({ ok: true, applied: r.applied });
  }
  if (action === "responded") {
    const r = await markLeadResponded(leadId, userId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    if (r.applied) recordQuickActionUsedMonitored("responded");
    return NextResponse.json({ ok: true, applied: r.applied });
  }
  if (action === "set_stage") {
    if (!isStage(body.stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    const r = await updateLeadStage(leadId, userId, body.stage);
    if (r.ok) recordQuickActionUsedMonitored(`set_stage:${body.stage}`);
    return r.ok ? NextResponse.json({ ok: true, applied: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
