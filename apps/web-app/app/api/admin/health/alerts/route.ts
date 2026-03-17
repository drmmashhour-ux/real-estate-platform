import { NextRequest } from "next/server";
import { createSystemAlert, getActiveAlerts, resolveAlert } from "@/lib/observability";
import type { AlertSeverity } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** GET: active (unresolved) alerts. */
export async function GET() {
  try {
    const alerts = await getActiveAlerts(50);
    return Response.json(alerts);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get alerts" }, { status: 500 });
  }
}

/** POST: create alert (e.g. from threshold monitor). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const alert = await createSystemAlert({
      alertType: body.alertType,
      severity: (body.severity as AlertSeverity) ?? "WARNING",
      message: body.message,
      threshold: body.threshold,
      currentValue: body.currentValue,
      metadata: body.metadata,
    });
    return Response.json(alert);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
