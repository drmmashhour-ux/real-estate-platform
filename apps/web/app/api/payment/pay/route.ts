import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { generateCanvaInvoice } from "@/lib/invoice/generate";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/pay
 * Body: { usageId: string }
 * Mock: marks usage as paid, creates CanvaInvoice. Later connect Stripe.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "This payment path is disabled in production. Use Stripe checkout when available." },
      { status: 403 }
    );
  }
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const usageId = body?.usageId as string | undefined;
    if (!usageId) {
      return Response.json({ error: "usageId required" }, { status: 400 });
    }

    const usage = await prisma.canvaDesignUsage.findFirst({
      where: { id: usageId, userId },
    });
    if (!usage) {
      return Response.json({ error: "Usage not found" }, { status: 404 });
    }
    if (usage.isPaid) {
      return Response.json({ error: "Already paid" }, { status: 400 });
    }

    await prisma.canvaDesignUsage.update({
      where: { id: usageId },
      data: { isPaid: true },
    });

    const invoiceData = generateCanvaInvoice({
      userId: usage.userId,
      usageId: usage.id,
      amount: usage.amount,
    });

    const invoice = await prisma.canvaInvoice.create({
      data: {
        userId: usage.userId,
        usageId: usage.id,
        amount: usage.amount,
        invoiceNumber: invoiceData.id,
      },
    });

    return Response.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoiceData.id,
      amount: invoice.amount,
      createdAt: invoice.createdAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Payment failed" }, { status: 500 });
  }
}
