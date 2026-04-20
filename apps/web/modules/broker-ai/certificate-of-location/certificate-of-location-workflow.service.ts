/**
 * Controlled broker workflow mutations — audited via BrokerVerificationLog; no silent execution.
 */

import { prisma } from "@/lib/db";
import type { CertificateOfLocationParsedData, CertificateOfLocationSummary } from "./certificate-of-location.types";
import { extractCertificateOfLocationParsedData } from "./certificate-of-location-parser.service";
import { looksLikeCertificateOfLocationType } from "./certificate-of-location-helpers";

export type WorkflowResult = {
  ok: boolean;
  reason?: string;
  auditId?: string;
};

/** Which workflow buttons the UI may show — does not imply server will accept without access checks. */
export function buildCertificateWorkflowActionsAvailability(
  summary: CertificateOfLocationSummary,
): {
  requestUpload: boolean;
  markReviewed: boolean;
  sendToAdmin: boolean;
} {
  const hasListing = Boolean(summary.listingId?.trim());
  const missingDoc = summary.status === "missing";
  const hasDocSignal = summary.status !== "missing" && summary.status !== "rejected";
  return {
    requestUpload: hasListing && missingDoc,
    markReviewed: hasListing && hasDocSignal,
    /** Explicit escalation — always offered when a listing is in scope (still requires auth on POST). */
    sendToAdmin: hasListing,
  };
}

export async function requestCertificateUpload(params: {
  listingId: string;
  brokerUserId: string;
}): Promise<WorkflowResult> {
  try {
    const lid = params.listingId.trim();
    if (!lid || !params.brokerUserId) return { ok: false, reason: "invalid_params" };

    const row = await prisma.brokerVerificationLog.create({
      data: {
        brokerUserId: params.brokerUserId,
        fsboListingId: lid,
        actionKey: "certificate_upload_requested",
        verificationAttempted: false,
        warningIssued: false,
        metadata: { intent: "certificate_of_location_v2", at: new Date().toISOString() },
      },
    });
    return { ok: true, auditId: row.id };
  } catch {
    return { ok: false, reason: "audit_write_failed" };
  }
}

export async function markCertificateReviewed(params: {
  listingId: string;
  reviewerId: string;
}): Promise<WorkflowResult> {
  try {
    const lid = params.listingId.trim();
    const rid = params.reviewerId.trim();
    if (!lid || !rid) return { ok: false, reason: "invalid_params" };

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const existing = await prisma.brokerVerificationLog.findFirst({
      where: {
        fsboListingId: lid,
        brokerUserId: rid,
        actionKey: "certificate_review_marked",
        createdAt: { gte: dayStart },
      },
      select: { id: true },
    });
    if (existing) {
      return { ok: true, auditId: existing.id, reason: "idempotent_duplicate" };
    }

    const row = await prisma.brokerVerificationLog.create({
      data: {
        brokerUserId: rid,
        fsboListingId: lid,
        actionKey: "certificate_review_marked",
        verificationAttempted: true,
        warningIssued: false,
        metadata: { reviewerId: rid, at: new Date().toISOString() },
      },
    });
    return { ok: true, auditId: row.id };
  } catch {
    return { ok: false, reason: "audit_write_failed" };
  }
}

export async function flagCertificateForAdminReview(params: {
  listingId: string;
  brokerUserId: string;
}): Promise<WorkflowResult> {
  const { enqueueCertificateReview } = await import("./certificate-of-location-admin-queue.service");
  const id = await enqueueCertificateReview({
    listingId: params.listingId,
    reason: "broker_flagged_certificate_review",
    actorUserId: params.brokerUserId,
  });
  if (!id) return { ok: false, reason: "enqueue_failed" };
  return { ok: true, auditId: id };
}

export async function attachParsedCertificateData(params: {
  listingId: string;
  parsedData: CertificateOfLocationParsedData;
}): Promise<WorkflowResult> {
  try {
    const lid = params.listingId.trim();
    if (!lid) return { ok: false, reason: "invalid_listing" };

    const rows = await prisma.legalRecord.findMany({
      where: { entityType: "fsbo_listing", entityId: lid, recordType: "compliance_document" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, parsedData: true },
    });

    const target = rows.find((r) =>
      looksLikeCertificateOfLocationType(
        String((r.parsedData as Record<string, unknown> | null)?.certificateType ?? ""),
      ),
    ) ?? rows[0];

    if (!target) return { ok: false, reason: "no_compliance_record" };

    const prev = target.parsedData && typeof target.parsedData === "object" ? (target.parsedData as Record<string, unknown>) : {};
    const merged = { ...prev, ...stripNulls(params.parsedData as Record<string, unknown>) };

    await prisma.legalRecord.update({
      where: { id: target.id },
      data: { parsedData: merged },
    });

    return { ok: true, auditId: target.id };
  } catch {
    return { ok: false, reason: "update_failed" };
  }
}

function stripNulls(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

export function mergeParsedIntoRecordJson(record: Record<string, unknown> | null, patch: CertificateOfLocationParsedData): Record<string, unknown> {
  const base = extractCertificateOfLocationParsedData(record);
  return { ...base, ...stripNulls(patch as unknown as Record<string, unknown>) };
}
