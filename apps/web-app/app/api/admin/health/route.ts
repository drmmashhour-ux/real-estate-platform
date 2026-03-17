import { NextRequest } from "next/server";
import {
  getPlatformHealthSnapshot,
  getLatestHealthMetrics,
  getActiveAlerts,
  getOperationalIncidents,
} from "@/lib/observability";

export const dynamic = "force-dynamic";

/** GET: platform health snapshot + metrics + active alerts + open incidents. */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    if (type === "snapshot") {
      const snapshot = await getPlatformHealthSnapshot();
      return Response.json(snapshot);
    }
    if (type === "metrics") {
      const serviceName = request.nextUrl.searchParams.get("serviceName") ?? undefined;
      const metrics = await getLatestHealthMetrics({ serviceName, limit: 50 });
      return Response.json(metrics);
    }
    if (type === "alerts") {
      const alerts = await getActiveAlerts(50);
      return Response.json(alerts);
    }
    if (type === "incidents") {
      const status = request.nextUrl.searchParams.get("status") ?? undefined;
      const incidents = await getOperationalIncidents({ status, limit: 20 });
      return Response.json(incidents);
    }
    const [snapshot, alerts, incidents] = await Promise.all([
      getPlatformHealthSnapshot(),
      getActiveAlerts(20),
      getOperationalIncidents({ status: "OPEN", limit: 10 }),
    ]);
    return Response.json({
      snapshot,
      alerts,
      incidents,
      metrics: await getLatestHealthMetrics({ limit: 30 }),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get health" }, { status: 500 });
  }
}
