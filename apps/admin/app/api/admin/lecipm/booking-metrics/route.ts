import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAiCloserLearningSnapshot } from "@/modules/ai-closer/ai-closer-learning.service";

export const dynamic = "force-dynamic";

/**
 * LECIPM visit bookings — admin dashboard: today’s visits, simple conversion proxy.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const [bookingsToday, schedWindow, last30, learning] = await Promise.all([
    prisma.lecipmVisit.count({
      where: { startDateTime: { gte: startOfDay, lt: endOfDay }, status: { in: ["scheduled", "completed"] } },
    }),
    prisma.lecipmVisit.count({
      where: { status: "scheduled" },
    }),
    prisma.lecipmVisit.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { id: true, status: true },
    }),
    getAiCloserLearningSnapshot(),
  ]);

  const missed = last30.filter((v) => v.status === "cancelled" || v.status === "no_show").length;
  const conversionApprox =
    last30.length > 0 ? Math.round((1 - missed / last30.length) * 1000) / 1000 : null;

  return Response.json({
    kind: "admin_lecipm_booking_metrics_v1",
    bookingsToday,
    activeScheduled: schedWindow,
    conversion30dApprox: conversionApprox,
    missedOrNoShow30d: missed,
    aiCloser: {
      lecipmVisitsBooked30d: learning.lecipmVisitsBooked30d,
      bookingSignals30d: learning.bookingSignals30d,
    },
  });
}
