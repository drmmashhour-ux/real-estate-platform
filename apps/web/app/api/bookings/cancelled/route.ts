import { requireAdminSession } from "@/lib/admin/require-admin";
import { marketplacePrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/cancelled — **admin** marketplace rows with cancellation metadata (Order 59.1).
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const rows = await marketplacePrisma.booking.findMany({
    where: { status: "cancelled" },
    orderBy: { cancelledAt: "desc" },
    take: 200,
    select: {
      id: true,
      cancelledAt: true,
      refundStatus: true,
    },
  });

  return Response.json({
    items: rows.map((r) => ({
      bookingId: r.id,
      cancelledAt: r.cancelledAt?.toISOString() ?? null,
      refundStatus: r.refundStatus ?? "none",
    })),
  });
}
