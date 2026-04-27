import { prisma } from "@/lib/db";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import type { SyriaListingPlan } from "@/generated/prisma";

export type F1ConfirmOutcome =
  | { type: "ok"; listingId: string }
  | { type: "not_found" }
  | { type: "rejected" }
  | { type: "bad_state" }
  | { type: "listing_missing" }
  | { type: "already"; listingId: string };

export type F1RejectOutcome =
  | { type: "ok"; listingId: string }
  | { type: "not_found" }
  | { type: "already"; status: string };

/**
 * Manual payment confirm (F1). Idempotent: second confirm returns `already` without extra increments.
 */
export async function runF1Confirm(requestId: string): Promise<F1ConfirmOutcome> {
  const days = syriaPlatformConfig.monetization.featuredDurationDays;
  return prisma.$transaction(async (tx) => {
    const row = await tx.syriaPaymentRequest.findUnique({ where: { id: requestId } });
    if (!row) return { type: "not_found" as const };
    if (row.status === "confirmed") {
      return { type: "already" as const, listingId: row.listingId };
    }
    if (row.status === "rejected") {
      return { type: "rejected" as const };
    }
    if (row.status !== "pending") {
      return { type: "bad_state" as const };
    }

    const targetPlan: SyriaListingPlan = row.plan === "premium" ? "premium" : "featured";
    const listing = await tx.syriaProperty.findUnique({ where: { id: row.listingId } });
    if (!listing) {
      return { type: "listing_missing" as const };
    }

    const until = new Date();
    until.setDate(until.getDate() + days);

    await tx.syriaPaymentRequest.update({
      where: { id: requestId },
      data: { status: "confirmed", confirmedAt: new Date() },
    });

    await tx.syriaProperty.update({
      where: { id: row.listingId },
      data: {
        plan: targetPlan,
        isFeatured: true,
        featuredUntil: until,
      },
    });

    await tx.syriaListingFinance.upsert({
      where: { listingId: row.listingId },
      create: {
        listingId: row.listingId,
        totalRequests: 0,
        totalConfirmed: 1,
        lastStatus: "confirmed",
      },
      update: {
        totalConfirmed: { increment: 1 },
        lastStatus: "confirmed",
      },
    });

    return { type: "ok" as const, listingId: row.listingId };
  });
}

export async function runF1Reject(requestId: string, reason?: string): Promise<F1RejectOutcome> {
  const row = await prisma.syriaPaymentRequest.findUnique({ where: { id: requestId } });
  if (!row) {
    return { type: "not_found" };
  }
  if (row.status !== "pending") {
    return { type: "already", status: row.status };
  }

  const note = reason?.trim() ? `rejected: ${reason.trim()}` : "rejected";
  const mergedNote = row.note ? `${row.note}\n${note}` : note;

  await prisma.$transaction([
    prisma.syriaPaymentRequest.update({
      where: { id: requestId },
      data: { status: "rejected", note: mergedNote },
    }),
    prisma.syriaListingFinance.upsert({
      where: { listingId: row.listingId },
      create: {
        listingId: row.listingId,
        totalRequests: 0,
        totalConfirmed: 0,
        lastStatus: "rejected",
      },
      update: { lastStatus: "rejected" },
    }),
  ]);

  return { type: "ok", listingId: row.listingId };
}
