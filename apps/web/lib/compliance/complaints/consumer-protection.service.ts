import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import {
  OACIQ_ESCALATION_DESTINATIONS,
  type EscalationDestinationMeta,
} from "@/lib/compliance/complaints/oaciq-escalation-destinations";

export function getProtectionResourceBundle(): EscalationDestinationMeta[] {
  return [...OACIQ_ESCALATION_DESTINATIONS];
}

export function buildClientProtectionNotice(): string {
  return [
    "OACIQ supervises Québec real estate brokerage and can explain professional rules.",
    "Public Assistance can help you understand options without replacing legal advice.",
    "The Syndic examines serious ethical or trust-account concerns.",
    "Your brokerage must still keep an internal file, timelines, and fair process — external routes are additive.",
  ].join("\n");
}

export async function markProtectionsExplained(input: {
  complaintCaseId: string;
  performedByUserId: string;
  channels?: string[];
}): Promise<void> {
  const c = await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { consumerProtectionExplainedAt: new Date() },
  });

  await prisma.complaintEvent.create({
    data: {
      complaintCaseId: c.id,
      eventType: "consumer_protections_explained",
      performedById: input.performedByUserId,
      details: { channels: input.channels ?? ["in_app_notice"] },
    },
  });

  await logAuditEvent({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    entityType: "complaint",
    entityId: c.id,
    actionType: "consumer_protections_explained",
    moduleKey: "consumer_protection",
    actorId: input.performedByUserId,
    linkedComplaintCaseId: c.id,
    summary: "Consumer protection resources explained",
    details: { channels: input.channels ?? [] },
    severity: "info",
  });
}
