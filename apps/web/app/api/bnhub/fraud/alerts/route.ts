import { NextRequest } from "next/server";
import { getFraudAlertsQueue, updateFraudAlert } from "@/lib/bnhub/fraud";

/** GET: fraud alerts queue for admin (optional ?status=NEW). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const alerts = await getFraudAlertsQueue({
      status:
        status === "NEW" || status === "REVIEWING" || status === "RESOLVED" || status === "DISMISSED"
          ? status
          : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return Response.json(alerts);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch fraud alerts" }, { status: 500 });
  }
}
