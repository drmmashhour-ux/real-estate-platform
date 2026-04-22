import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { detectAdminAnomalies } from "@/modules/admin-intelligence";

export const dynamic = "force-dynamic";

/** GET /api/mobile/admin/alerts — anomaly cards for push-friendly clients. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const anomalies = await detectAdminAnomalies();
    const critical = anomalies.filter((a) => a.severity === "HIGH").length;
    return Response.json({
      count: anomalies.length,
      criticalCount: critical,
      items: anomalies,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "alerts_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
