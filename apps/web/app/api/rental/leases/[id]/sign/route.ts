import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST — tenant signs lease (acceptance required). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = await getGuestId();
  if (!tenantId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = (await request.json().catch(() => ({}))) as { legalAcceptedAt?: string };
    if (!body.legalAcceptedAt) {
      return Response.json({ error: "legalAcceptedAt is required to sign" }, { status: 400 });
    }
    const accepted = new Date(body.legalAcceptedAt);
    if (Number.isNaN(accepted.getTime())) {
      return Response.json({ error: "Invalid legalAcceptedAt" }, { status: 400 });
    }

    const lease = await prisma.rentalLease.findUnique({ where: { id } });
    if (!lease) {
      return Response.json({ error: "Lease not found" }, { status: 404 });
    }
    if (lease.tenantId !== tenantId) {
      return Response.json({ error: "Only the tenant can sign this lease" }, { status: 403 });
    }
    if (lease.status !== "PENDING_SIGNATURE") {
      return Response.json({ error: "Lease is not awaiting signature" }, { status: 400 });
    }

    const updated = await prisma.rentalLease.update({
      where: { id },
      data: {
        status: "ACTIVE",
        signedAt: accepted,
      },
    });
    return Response.json({ lease: updated });
  } catch (e) {
    console.error("POST /api/rental/leases/[id]/sign:", e);
    return Response.json({ error: "Failed to sign lease" }, { status: 500 });
  }
}
