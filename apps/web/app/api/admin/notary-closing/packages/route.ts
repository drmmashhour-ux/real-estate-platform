import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/notary-closing/packages
 * Query: transactionId?, status?, limit
 * List closing packages for admin console.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const packages = await prisma.closingPackage.findMany({
      where: {
        ...(transactionId && { transactionId }),
        ...(status && { packageStatus: status }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        transaction: { select: { id: true, status: true, offerPrice: true } },
        generatedBy: { select: { id: true, name: true, email: true } },
        notary: { select: { id: true, notaryName: true, notaryEmail: true } },
        _count: { select: { documents: true } },
      },
    });
    return Response.json({ packages });
  } catch (e) {
    return Response.json({ error: "Failed to list closing packages" }, { status: 500 });
  }
}
