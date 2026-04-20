/**
 * Admin certificate review queue via LegalAlert — OPEN rows are pending.
 */

import { prisma } from "@/lib/db";

const QUEUE_TITLE = "CERTIFICATE_LOCATION_ADMIN_REVIEW";

export async function enqueueCertificateReview(params: {
  listingId: string;
  reason: string;
  actorUserId?: string;
}): Promise<string | null> {
  try {
    const lid = params.listingId.trim();
    const reason = params.reason.trim().slice(0, 480);
    if (!lid || !reason) return null;

    const dup = await prisma.legalAlert.findFirst({
      where: {
        entityType: "LISTING_FSBO",
        entityId: lid,
        status: "OPEN",
        title: QUEUE_TITLE,
      },
      select: { id: true },
    });
    if (dup) return dup.id;

    const row = await prisma.legalAlert.create({
      data: {
        entityType: "LISTING_FSBO",
        entityId: lid,
        riskLevel: "MEDIUM",
        status: "OPEN",
        title: QUEUE_TITLE,
        detail: reason,
        signals: {
          kind: "certificate_location_v2",
          requestedBy: params.actorUserId ?? null,
          at: new Date().toISOString(),
        },
      },
    });
    return row.id;
  } catch {
    return null;
  }
}

export async function getPendingCertificateReviews(): Promise<
  Array<{ id: string; listingId: string; detail: string; createdAt: Date }>
> {
  try {
    const rows = await prisma.legalAlert.findMany({
      where: { status: "OPEN", title: QUEUE_TITLE },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, entityId: true, detail: true, createdAt: true },
    });
    return rows.map((r) => ({
      id: r.id,
      listingId: r.entityId,
      detail: r.detail,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}
