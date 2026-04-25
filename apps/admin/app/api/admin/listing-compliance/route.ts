import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET — compliance review queue (BNHUB listings). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.listingComplianceReview.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          listingCode: true,
          ownerId: true,
        },
      },
    },
  });
  return Response.json(rows);
}
