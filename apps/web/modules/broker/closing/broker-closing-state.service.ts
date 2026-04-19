/**
 * Broker closing V1 — read/write closing stage via additive `aiExplanation.brokerClosingV1` + CRM pipeline fields.
 * Does not mutate lead name, email, phone, or message.
 */

import { prisma } from "@/lib/db";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";
import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";
import { brokerClosingFlags } from "@/config/feature-flags";
import type { LeadClosingStage, LeadClosingState, PersistedBrokerClosingV1 } from "./broker-closing.types";

const STAGE_ORDER: LeadClosingStage[] = [
  "new",
  "contacted",
  "responded",
  "meeting_scheduled",
  "negotiation",
  "closed_won",
  "closed_lost",
];

/** Deterministic ordering for idempotent “mark contacted / responded” guards. */
export function closingStageRank(stage: LeadClosingStage): number {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : 0;
}

export function shouldSkipMarkContacted(current: LeadClosingState): boolean {
  return closingStageRank(current.stage) >= closingStageRank("contacted");
}

export function shouldSkipMarkResponded(current: LeadClosingState): boolean {
  return closingStageRank(current.stage) >= closingStageRank("responded");
}
import { mergeBrokerClosingIntoAiExplanation, parseBrokerClosingV1 } from "./broker-closing-persist";
import {
  recordDealClosedMonitored,
  recordLeadContactedMonitored,
  recordLeadRespondedMonitored,
  recordMeetingScheduledMonitored,
} from "./broker-closing-monitoring.service";

/** Derive closing stage for list/summary views (read-only). */
export function deriveLeadClosingStageFromRow(lead: {
  aiExplanation: unknown;
  pipelineStage: string | null;
  pipelineStatus: string | null;
  wonAt: Date | null;
  lostAt: Date | null;
}): LeadClosingStage {
  const persisted = parseBrokerClosingV1(lead.aiExplanation);
  if (persisted?.stage) return persisted.stage;
  return pipelineToClosingStage(lead);
}

function pipelineToClosingStage(lead: {
  pipelineStage: string | null;
  pipelineStatus: string | null;
  wonAt: Date | null;
  lostAt: Date | null;
}): LeadClosingStage {
  if (lead.wonAt) return "closed_won";
  if (lead.lostAt) return "closed_lost";
  const raw = lead.pipelineStage ?? lead.pipelineStatus ?? "new";
  const p = normalizePipelineStage(raw);
  if (p === "won") return "closed_won";
  if (p === "lost") return "closed_lost";
  if (p === "meeting_scheduled") return "meeting_scheduled";
  if (p === "negotiation" || p === "closing") return "negotiation";
  if (p === "qualified") return "responded";
  if (p === "contacted") return "contacted";
  return "new";
}

function responseReceivedFromLead(lead: {
  dmStatus: string;
  brokerClosing?: PersistedBrokerClosingV1 | null;
}): boolean {
  if (lead.brokerClosing?.responseReceived) return true;
  return lead.dmStatus === "replied";
}

/** Maps closing stage to stored CRM pipeline strings (existing normalize-compatible). */
export function closingStageToPipelineStorage(stage: LeadClosingStage): string {
  switch (stage) {
    case "new":
      return "new";
    case "contacted":
      return "contacted";
    case "responded":
      return "qualified";
    case "meeting_scheduled":
      return "meeting_scheduled";
    case "negotiation":
      return "negotiation";
    case "closed_won":
      return "won";
    case "closed_lost":
      return "lost";
    default:
      return "new";
  }
}

/** Build closing state from a lead row (same process as getLeadClosingState; no extra DB read). */
export function buildLeadClosingStateFromLeadRecord(
  leadId: string,
  brokerId: string,
  lead: {
    aiExplanation: unknown;
    lastContactedAt: Date | null;
    firstContactAt: Date | null;
    pipelineStage: string | null;
    pipelineStatus: string | null;
    wonAt: Date | null;
    lostAt: Date | null;
    dmStatus: string;
    createdAt: Date;
  },
): LeadClosingState {
  const persisted = parseBrokerClosingV1(lead.aiExplanation);
  const inferred = pipelineToClosingStage(lead);
  const stage = persisted?.stage ?? inferred;
  const responseReceived = responseReceivedFromLead({
    dmStatus: lead.dmStatus,
    brokerClosing: persisted,
  });
  const lastContact = lead.lastContactedAt ?? lead.firstContactAt;
  const boot = lead.createdAt.toISOString();
  return {
    leadId,
    brokerId,
    stage,
    lastContactAt: lastContact?.toISOString(),
    responseReceived,
    notes: persisted?.notes,
    createdAt: persisted?.createdAt ?? boot,
    updatedAt: persisted?.updatedAt ?? boot,
  };
}

export async function getLeadClosingState(leadId: string, brokerId: string): Promise<LeadClosingState | null> {
  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) return null;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      leadSource: true,
      aiExplanation: true,
      lastContactedAt: true,
      firstContactAt: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
      dmStatus: true,
      createdAt: true,
    },
  });
  if (!lead) return null;
  if (!canBrokerOrAdminAccessLead(user.role, brokerId, lead)) return null;

  return buildLeadClosingStateFromLeadRecord(leadId, brokerId, lead);
}

type MutateResult = { ok: true } | { ok: false; error: string };

type MarkAppliedResult =
  | { ok: true; applied: true }
  | { ok: true; applied: false }
  | { ok: false; error: string };

async function mutateLead(
  leadId: string,
  brokerId: string,
  patch: Partial<PersistedBrokerClosingV1> & { stage?: LeadClosingStage },
  pipelineExtra?: {
    setWonAt?: boolean;
    setLostAt?: boolean;
    setMeetingAt?: boolean;
  },
): Promise<MutateResult> {
  if (!brokerClosingFlags.brokerClosingV1) {
    return { ok: false, error: "Broker closing V1 is disabled" };
  }

  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { ok: false, error: "Forbidden" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      leadSource: true,
      aiExplanation: true,
      wonAt: true,
      lostAt: true,
      meetingAt: true,
      firstContactAt: true,
    },
  });
  if (!lead) return { ok: false, error: "Lead not found" };
  if (!canBrokerOrAdminAccessLead(user.role, brokerId, lead)) return { ok: false, error: "Forbidden" };

  const merged = mergeBrokerClosingIntoAiExplanation(lead.aiExplanation, patch);
  const nextStage = (merged.brokerClosingV1 as PersistedBrokerClosingV1).stage;
  const pipeline = closingStageToPipelineStorage(nextStage);

  const now = new Date();
  const data: Parameters<typeof prisma.lead.update>[0]["data"] = {
    aiExplanation: merged as object,
    pipelineStage: pipeline,
    pipelineStatus: pipeline,
  };

  const touchesContact = nextStage === "contacted" || nextStage === "responded";
  if (touchesContact) {
    data.lastContactedAt = now;
    data.lastContactAt = now;
    if (!lead.firstContactAt) data.firstContactAt = now;
  }
  if (nextStage === "responded") {
    data.lastContactedAt = now;
    data.lastContactAt = now;
  }
  if (pipelineExtra?.setMeetingAt || nextStage === "meeting_scheduled") {
    if (!lead.meetingAt) data.meetingAt = now;
    data.meetingScheduledAt = now;
  }
  const becameWon = (pipelineExtra?.setWonAt || nextStage === "closed_won") && !lead.wonAt;
  const becameLost = (pipelineExtra?.setLostAt || nextStage === "closed_lost") && !lead.lostAt;
  if (becameWon) {
    data.wonAt = now;
    data.dealClosedAt = now;
  }
  if (becameLost) {
    data.lostAt = now;
  }

  await prisma.lead.update({ where: { id: leadId }, data });

  if (becameWon) {
    recordDealClosedMonitored();
  }

  return { ok: true };
}

export async function updateLeadStage(
  leadId: string,
  brokerId: string,
  stage: LeadClosingStage,
): Promise<MutateResult> {
  const extra: { setWonAt?: boolean; setLostAt?: boolean; setMeetingAt?: boolean } = {};
  if (stage === "meeting_scheduled") extra.setMeetingAt = true;
  if (stage === "closed_won") extra.setWonAt = true;
  if (stage === "closed_lost") extra.setLostAt = true;

  const r = await mutateLead(leadId, brokerId, { stage }, extra);
  if (!r.ok) return r;

  if (stage === "meeting_scheduled") recordMeetingScheduledMonitored();
  return { ok: true };
}

export async function markLeadContacted(leadId: string, brokerId: string): Promise<MarkAppliedResult> {
  if (!brokerClosingFlags.brokerClosingV1) {
    return { ok: false, error: "Broker closing V1 is disabled" };
  }

  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { ok: false, error: "Forbidden" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      leadSource: true,
      aiExplanation: true,
      lastContactedAt: true,
      firstContactAt: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
      dmStatus: true,
      createdAt: true,
    },
  });
  if (!lead) return { ok: false, error: "Lead not found" };
  if (!canBrokerOrAdminAccessLead(user.role, brokerId, lead)) return { ok: false, error: "Forbidden" };

  const current = buildLeadClosingStateFromLeadRecord(leadId, brokerId, lead);
  if (shouldSkipMarkContacted(current)) return { ok: true, applied: false };

  const r = await mutateLead(leadId, brokerId, { stage: "contacted" }, {});
  if (r.ok) recordLeadContactedMonitored();
  return r.ok ? { ok: true, applied: true } : r;
}

export async function markLeadResponded(leadId: string, brokerId: string): Promise<MarkAppliedResult> {
  if (!brokerClosingFlags.brokerClosingV1) {
    return { ok: false, error: "Broker closing V1 is disabled" };
  }

  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { ok: false, error: "Forbidden" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      leadSource: true,
      aiExplanation: true,
      lastContactedAt: true,
      firstContactAt: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
      dmStatus: true,
      createdAt: true,
    },
  });
  if (!lead) return { ok: false, error: "Lead not found" };
  if (!canBrokerOrAdminAccessLead(user.role, brokerId, lead)) return { ok: false, error: "Forbidden" };

  const current = buildLeadClosingStateFromLeadRecord(leadId, brokerId, lead);
  if (shouldSkipMarkResponded(current)) return { ok: true, applied: false };

  const r = await mutateLead(leadId, brokerId, { stage: "responded", responseReceived: true }, {});
  if (r.ok) recordLeadRespondedMonitored();
  return r.ok ? { ok: true, applied: true } : r;
}
