import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const lease = await prisma.rentalLease.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, address: true, city: true, listingCode: true } },
        tenant: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { dueDate: "asc" } },
      },
    });
    if (!lease) {
      return Response.json({ error: "Lease not found" }, { status: 404 });
    }
    if (lease.tenantId !== userId && lease.landlordId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ lease });
  } catch (e) {
    console.error("GET /api/rental/leases/[id]:", e);
    return Response.json({ error: "Failed to load lease" }, { status: 500 });
  }
}
