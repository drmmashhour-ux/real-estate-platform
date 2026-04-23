import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST — landlord marks rent as paid (demo; no Stripe). */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const landlordId = await getGuestId();
  if (!landlordId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const payment = await prisma.rentPayment.findUnique({
      where: { id },
      include: { lease: true },
    });
    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.lease.landlordId !== landlordId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await prisma.rentPayment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    return Response.json({ payment: updated });
  } catch (e) {
    console.error("POST /api/rental/payments/[id]/mark-paid:", e);
    return Response.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
