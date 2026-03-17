/**
 * Trust & Safety incident reporting, evidence, escalation, and resolution.
 */

import { prisma } from "@/lib/db";
import type { TrustSafetySeverity, TrustSafetyRiskLevel } from "@prisma/client";
import {
  INCIDENT_CATEGORIES,
  EMERGENCY_CATEGORIES,
  HIGH_SEVERITY_CATEGORIES,
  type IncidentCategory,
  type SeverityLevel,
  type UrgencyLevel,
} from "./engine-constants";
import { notifyTrustSafety } from "./notifications";

function severityFromCategory(category: IncidentCategory): TrustSafetySeverity {
  if (EMERGENCY_CATEGORIES.includes(category)) return "EMERGENCY";
  if (HIGH_SEVERITY_CATEGORIES.includes(category)) return "HIGH";
  return "MEDIUM";
}

function urgencyFromCategory(category: IncidentCategory): UrgencyLevel {
  if (EMERGENCY_CATEGORIES.includes(category)) return "emergency";
  if (HIGH_SEVERITY_CATEGORIES.includes(category)) return "urgent";
  return "normal";
}

export interface CreateIncidentInput {
  reporterId: string;
  accusedUserId?: string | null;
  listingId?: string | null;
  bookingId?: string | null;
  incidentCategory: IncidentCategory | string;
  severityLevel?: SeverityLevel;
  urgencyLevel?: UrgencyLevel;
  description: string;
  incidentTime?: Date | null;
  riskScore?: number | null;
  /** Internal/support-originated */
  createdBySupport?: boolean;
}

export async function createIncident(input: CreateIncidentInput): Promise<{ incidentId: string }> {
  const category = INCIDENT_CATEGORIES.includes(input.incidentCategory as IncidentCategory)
    ? (input.incidentCategory as IncidentCategory)
    : "other";

  const severity = input.severityLevel
    ? (input.severityLevel as TrustSafetySeverity)
    : severityFromCategory(category);
  const urgency = input.urgencyLevel ?? urgencyFromCategory(category);

  let riskLevel: TrustSafetyRiskLevel | null = null;
  if (input.riskScore != null) {
    if (input.riskScore >= 0.8) riskLevel = "CRITICAL_RISK";
    else if (input.riskScore >= 0.5) riskLevel = "HIGH_RISK";
    else if (input.riskScore >= 0.2) riskLevel = "MEDIUM_RISK";
    else riskLevel = "LOW_RISK";
  }

  const incident = await prisma.trustSafetyIncident.create({
    data: {
      reporterId: input.reporterId,
      accusedUserId: input.accusedUserId ?? undefined,
      listingId: input.listingId ?? undefined,
      bookingId: input.bookingId ?? undefined,
      incidentCategory: category,
      severityLevel: severity,
      riskScore: input.riskScore ?? undefined,
      riskLevel,
      status: severity === "EMERGENCY" ? "ESCALATED" : "SUBMITTED",
      urgencyLevel: urgency,
      description: input.description,
      incidentTime: input.incidentTime ?? undefined,
    },
  });

  if (severity === "EMERGENCY") {
    void notifyTrustSafety({
      event: "dispute_escalated",
      disputeId: incident.id,
      listingId: input.listingId ?? undefined,
      bookingId: input.bookingId ?? undefined,
      userId: input.reporterId,
      message: "Emergency incident – escalated to trust & safety",
      metadata: { incidentCategory: category },
    });
  }

  void notifyTrustSafety({
    event: "complaint_submitted",
    disputeId: incident.id,
    listingId: input.listingId ?? undefined,
    bookingId: input.bookingId ?? undefined,
    userId: input.reporterId,
    metadata: { incidentCategory: category, severity, urgency },
  });

  return { incidentId: incident.id };
}

export async function addIncidentEvidence(params: {
  incidentId: string;
  fileUrl: string;
  fileType?: string;
  label?: string;
  uploadedBy: string;
}): Promise<string> {
  const ev = await prisma.trustSafetyEvidence.create({
    data: {
      incidentId: params.incidentId,
      fileUrl: params.fileUrl,
      fileType: params.fileType ?? undefined,
      label: params.label ?? undefined,
      uploadedBy: params.uploadedBy,
    },
  });
  return ev.id;
}

export async function getIncident(incidentId: string) {
  return prisma.trustSafetyIncident.findUniqueOrThrow({
    where: { id: incidentId },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      accusedUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, city: true, listingStatus: true, ownerId: true } },
      booking: { select: { id: true, checkIn: true, checkOut: true, status: true, guestId: true } },
      evidence: true,
      actions: true,
      appeals: true,
      responses: true,
    },
  });
}

export async function escalateIncident(incidentId: string, escalatedBy: string): Promise<void> {
  await prisma.trustSafetyIncident.update({
    where: { id: incidentId },
    data: { status: "ESCALATED", updatedAt: new Date() },
  });
  void notifyTrustSafety({
    event: "dispute_escalated",
    disputeId: incidentId,
    userId: escalatedBy,
    message: "Incident escalated to trust & safety",
  });
}

export async function resolveIncident(params: {
  incidentId: string;
  resolvedBy: string;
  resolutionNotes?: string | null;
}): Promise<void> {
  await prisma.trustSafetyIncident.update({
    where: { id: params.incidentId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: params.resolvedBy,
      resolutionNotes: params.resolutionNotes ?? undefined,
      updatedAt: new Date(),
    },
  });
}

export async function closeIncident(incidentId: string): Promise<void> {
  await prisma.trustSafetyIncident.update({
    where: { id: incidentId },
    data: { status: "CLOSED", updatedAt: new Date() },
  });
}

/** Add a response (accused or reporter) to the incident; sets status to WAITING_RESPONSE if needed. */
export async function addIncidentResponse(params: {
  incidentId: string;
  respondentId: string;
  body: string;
}): Promise<string> {
  const res = await prisma.trustSafetyIncidentResponse.create({
    data: {
      incidentId: params.incidentId,
      respondentId: params.respondentId,
      body: params.body,
    },
  });
  await prisma.trustSafetyIncident.update({
    where: { id: params.incidentId },
    data: { status: "WAITING_RESPONSE", updatedAt: new Date() },
  });
  return res.id;
}

export async function listIncidents(filters: {
  status?: string;
  severity?: string;
  category?: string;
  reporterId?: string;
  accusedUserId?: string;
  listingId?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severityLevel = filters.severity;
  if (filters.category) where.incidentCategory = filters.category;
  if (filters.reporterId) where.reporterId = filters.reporterId;
  if (filters.accusedUserId) where.accusedUserId = filters.accusedUserId;
  if (filters.listingId) where.listingId = filters.listingId;

  return prisma.trustSafetyIncident.findMany({
    where,
    take: Math.min(filters.limit ?? 50, 100),
    orderBy: [{ urgencyLevel: "desc" }, { createdAt: "desc" }],
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      accusedUser: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, city: true } },
    },
  });
}

/** For unsafe property: freeze payout, set urgent, optionally freeze listing. */
export async function markIncidentUrgent(incidentId: string): Promise<void> {
  await prisma.trustSafetyIncident.update({
    where: { id: incidentId },
    data: {
      severityLevel: "EMERGENCY",
      urgencyLevel: "emergency",
      status: "ESCALATED",
      updatedAt: new Date(),
    },
  });
}
