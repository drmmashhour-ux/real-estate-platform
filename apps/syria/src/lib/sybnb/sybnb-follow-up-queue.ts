/**
 * ORDER SYBNB-70 — Candidates for manual operator follow-up (listing inquiries).
 */

import { prisma } from "@/lib/db";

export type FollowUpInquiryRow = {
  inquiryId: string;
  createdAt: Date;
  guestName: string;
  phone: string | null;
  message: string | null;
  propertyId: string;
  propertyTitleAr: string;
  city: string;
  /** Listing excluded from feed/trust surfaces — ops may still reach out at discretion */
  needsReview: boolean;
};

/** Inquiries whose age is within **[minHours, maxHours]** (typically 12–24 for SYBNB-70). */
export async function listInquiriesForManualFollowUpWindow(opts?: {
  minHours?: number;
  maxHours?: number;
  limit?: number;
}): Promise<FollowUpInquiryRow[]> {
  const minH = opts?.minHours ?? 12;
  const maxH = opts?.maxHours ?? 24;
  const limit = Math.min(Math.max(opts?.limit ?? 80, 1), 200);

  const now = Date.now();
  const upper = new Date(now - minH * 3600000);
  const lower = new Date(now - maxH * 3600000);

  const rows = await prisma.syriaInquiry.findMany({
    where: {
      createdAt: {
        gte: lower,
        lte: upper,
      },
      property: {
        status: "PUBLISHED",
        fraudFlag: false,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          titleAr: true,
          city: true,
          needsReview: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    inquiryId: r.id,
    createdAt: r.createdAt,
    guestName: r.name,
    phone: r.phone ?? "",
    message: r.message,
    propertyId: r.property.id,
    propertyTitleAr: r.property.titleAr,
    city: r.property.city,
    needsReview: r.property.needsReview,
  }));
}
