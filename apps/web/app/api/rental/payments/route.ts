import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — payments for current user (tenant or landlord). */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const role = new URL(request.url).searchParams.get("role") ?? "tenant";
  try {
    const where =
      role === "landlord"
        ? { lease: { landlordId: userId } }
        : { lease: { tenantId: userId } };

    const payments = await prisma.rentPayment.findMany({
      where,
      orderBy: { dueDate: "desc" },
      include: {
        lease: {
          select: {
            id: true,
            listing: { select: { title: true, address: true, listingCode: true } },
          },
        },
      },
      take: 200,
    });
    return Response.json({ payments });
  } catch (e) {
    console.error("GET /api/rental/payments:", e);
    return Response.json({ error: "Failed to load payments" }, { status: 500 });
  }
}
