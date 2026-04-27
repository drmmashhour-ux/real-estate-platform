import { prisma } from "@/lib/db";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import type { SyriaListingPlan } from "@/generated/prisma";
import { f1GetPaymentSecret, f1VerifyPaymentRequestSig } from "@/lib/payment-request-signature";

export type F1ConfirmOutcome =
  | { type: "ok"; listingId: string }
  | { type: "not_found" }
  | { type: "rejected" }
  | { type: "bad_state" }
  | { type: "listing_missing" }
  | { type: "already"; listingId: string }
  | { type: "bad_sig" }
  | { type: "no_secret" };

export type F1RejectOutcome =
  | { type: "ok"; listingId: string }
  | { type: "not_found" }
  | { type: "already"; status: string };

/**
 * Manual payment confirm (F1). S3: requires HMAC sig; idempotent on second confirm.
 */
export async function runF1Confirm(
  requestId: string,
  ctx: { sig: string; adminId: string | null; clientIp: string | null },
): Promise<F1ConfirmOutcome> {
  const secret = f1GetPaymentSecret();
  if (!secret) {
    return { type: "no_secret" };
  }

  const row = await prisma.syriaPaymentRequest.findUnique({ where: { id: requestId } });
  if (!row) {
    return { type: "not_found" };
  }
  if (row.status === "confirmed") {
    return { type: "already", listingId: row.listingId };
  }
  if (row.status === "rejected") {
    return { type: "rejected" };
  }
  if (row.status !== "pending") {
    return { type: "bad_state" };
  }
  if (!f1VerifyPaymentRequestSig(ctx.sig, row.id, row.listingId, row.amount, secret)) {
    return { type: "bad_sig" };
  }

  const days = syriaPlatformConfig.monetization.featuredDurationDays;
  const targetPlan: SyriaListingPlan = row.plan === "premium" ? "premium" : "featured";

  return prisma.$transaction(async (tx) => {
    const up = await tx.syriaPaymentRequest.updateMany({
      where: { id: requestId, status: "pending" },
      data: { status: "confirmed", confirmedAt: new Date() },
    });
    if (up.count === 0) {
      const cur = await tx.syriaPaymentRequest.findUnique({ where: { id: requestId } });
      if (cur?.status === "confirmed" && cur.listingId) {
        return { type: "already" as const, listingId: cur.listingId };
      }
      return { type: "bad_state" as const };
    }

    const listing = await tx.syriaProperty.findUnique({ where: { id: row.listingId } });
    if (!listing) {
      await tx.syriaPaymentRequest.updateMany({
        where: { id: requestId, status: "confirmed" },
        data: { status: "pending", confirmedAt: null },
      });
      return { type: "listing_missing" as const };
    }

    const until = new Date();
    until.setDate(until.getDate() + days);

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

    await tx.syriaPaymentAuditLog.create({
      data: {
        requestId,
        action: "confirmed",
        adminId: ctx.adminId,
        ip: ctx.clientIp,
      },
    });

    return { type: "ok" as const, listingId: row.listingId };
  });
}

export async function runF1Reject(
  requestId: string,
  reason: string | undefined,
  ctx: { adminId: string | null; clientIp: string | null },
): Promise<F1RejectOutcome> {
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
    prisma.syriaPaymentAuditLog.create({
      data: {
        requestId,
        action: "rejected",
        adminId: ctx.adminId,
        ip: ctx.clientIp,
      },
    }),
  ]);

  return { type: "ok", listingId: row.listingId };
}
