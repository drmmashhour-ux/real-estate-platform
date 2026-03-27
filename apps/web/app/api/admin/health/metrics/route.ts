import { NextRequest } from "next/server";
import { recordHealthMetric } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** POST: record a service health metric (for cron or health checks). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const serviceName = body?.serviceName;
    const metricName = body?.metricName;
    const value = body?.value;
    const unit = body?.unit;
    const region = body?.region;
    if (!serviceName || !metricName || typeof value !== "number") {
      return Response.json(
        { error: "serviceName, metricName, value required" },
        { status: 400 }
      );
    }
    const metric = await recordHealthMetric({
      serviceName,
      metricName,
      value,
      unit,
      region,
    });
    return Response.json(metric);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record metric" }, { status: 500 });
  }
}
