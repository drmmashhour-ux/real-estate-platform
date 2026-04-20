/**
 * Journey step signals — read-only listing checks for hub journey (deterministic).
 */

import { prisma } from "@/lib/db";
import { brokerAiFlags } from "@/config/feature-flags";
import { looksLikeCertificateOfLocationType } from "./certificate-of-location-helpers";

const CERT_SLOT_OK = ["uploaded", "pending_review", "approved"] as const;

/**
 * Seller journey: active listings should have certificate-class structured record or approved certificate slot when V2 is on.
 */
export async function sellerCertificateLocationJourneySatisfied(ownerUserId: string): Promise<boolean> {
  try {
    if (!brokerAiFlags.brokerAiCertificateOfLocationV2) return true;

    const actives = await prisma.fsboListing.findMany({
      where: { ownerId: ownerUserId, status: "ACTIVE" },
      select: { id: true },
      take: 12,
    });

    if (actives.length === 0) return true;

    for (const { id } of actives) {
      const rows = await prisma.legalRecord.findMany({
        where: { entityType: "fsbo_listing", entityId: id, recordType: "compliance_document" },
        select: { parsedData: true },
        take: 8,
      });

      const hasCol = rows.some((r) => {
        const p = r.parsedData as Record<string, unknown> | null | undefined;
        const t = String(p?.certificateType ?? "");
        return looksLikeCertificateOfLocationType(t) || t.toLowerCase().includes("location");
      });

      const slot = await prisma.fsboListingDocument.findFirst({
        where: {
          fsboListingId: id,
          docType: "certificate_optional",
          status: { in: [...CERT_SLOT_OK] },
        },
        select: { id: true },
      });

      if (!hasCol && !slot) return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Broker journey: once the broker unlocks leads, expect at least one audited certificate workflow touch (request or review).
 */
export async function brokerCertificateLocationJourneySatisfied(brokerUserId: string, leadsUnlocked: number): Promise<boolean> {
  try {
    if (!brokerAiFlags.brokerAiCertificateOfLocationV2) return true;
    if (leadsUnlocked === 0) return true;

    const row = await prisma.brokerVerificationLog.findFirst({
      where: {
        brokerUserId,
        actionKey: { in: ["certificate_upload_requested", "certificate_review_marked"] },
      },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return true;
  }
}
