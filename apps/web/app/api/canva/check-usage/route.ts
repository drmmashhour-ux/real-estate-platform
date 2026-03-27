import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const TRIAL_DAYS = 7;
const AMOUNT = 5;

/**
 * POST /api/canva/check-usage
 * Body: { listingId: string }
 * Returns: { allowed, trialEndsAt?, mustPay?, usageId?, amount? }
 * - If no userId → allowed true (anonymous can open, no tracking).
 * - If first use → create CanvaDesignUsage with trialEndsAt = now + 7 days, allowed true.
 * - If trial active → allowed true.
 * - If trial expired and not paid → allowed false, mustPay true, usageId, amount.
 * - If trial expired and paid → allowed true (or create new usage for this session).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const body = await request.json().catch(() => ({}));
    const listingId = body?.listingId as string | undefined;
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }

    if (!userId) {
      return Response.json({
        allowed: true,
        trialEndsAt: null,
        mustPay: false,
        usageId: null,
        amount: null,
      });
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    // Find most recent usage for this user (any listing) for trial/payment state
    const latestUsage = await prisma.canvaDesignUsage.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestUsage) {
      const usage = await prisma.canvaDesignUsage.create({
        data: {
          userId,
          listingId,
          trialEndsAt: trialEnd,
          isPaid: false,
          amount: AMOUNT,
        },
      });
      return Response.json({
        allowed: true,
        trialEndsAt: usage.trialEndsAt.toISOString(),
        mustPay: false,
        usageId: usage.id,
        amount: usage.amount,
      });
    }

    const inTrial = latestUsage.trialEndsAt > now;
    if (inTrial) {
      return Response.json({
        allowed: true,
        trialEndsAt: latestUsage.trialEndsAt.toISOString(),
        mustPay: false,
        usageId: latestUsage.id,
        amount: latestUsage.amount,
      });
    }

    if (latestUsage.isPaid) {
      // Allow; next use could create another usage row for next payment (simplified: one usage per user for now)
      return Response.json({
        allowed: true,
        trialEndsAt: null,
        mustPay: false,
        usageId: latestUsage.id,
        amount: latestUsage.amount,
      });
    }

    return Response.json({
      allowed: false,
      trialEndsAt: latestUsage.trialEndsAt.toISOString(),
      mustPay: true,
      usageId: latestUsage.id,
      amount: latestUsage.amount,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
