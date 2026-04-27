import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAcquisitionInsights } from "@/lib/growth/acquisitionInsights";

export const dynamic = "force-dynamic";

/**
 * Admin-only. First-touch signup channel mix + simple funnel (Order 50.1).
 * Response is stable for dashboards; extended metrics may be added as optional fields.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const data = await getAcquisitionInsights();
  return Response.json(
    {
      channels: data.channels.map((c) => ({
        source: c.source,
        users: c.users,
        percentage: c.percentage,
        onboardedUsers: c.onboardedUsers,
        convertedUsers: c.convertedUsers,
        conversionRate: c.conversionRate,
      })),
      topChannel: data.topChannel,
      totalUsers: data.totalUsers,
    },
    {
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}
