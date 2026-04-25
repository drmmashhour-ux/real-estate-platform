import { loadAdminBookingMetrics } from "@/lib/bookings/load-admin-booking-metrics";
import { requireMobileAdmin } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/booking-metrics — platform admin (Prisma ADMIN or `app_metadata.bnhub_admin`).
 */
export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const st = (e as Error & { status?: number }).status ?? 401;
    return Response.json({ error: st === 403 ? "Forbidden" : "Unauthorized" }, { status: st });
  }

  const result = await loadAdminBookingMetrics();
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 503 });
  }
  return Response.json(result);
}
