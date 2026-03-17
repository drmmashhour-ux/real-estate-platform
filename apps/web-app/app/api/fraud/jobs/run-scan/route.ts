import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runHourlyListingScan, runDailyCadastreDuplicateScan, runDailyBrokerActivityScan } from "@/lib/anti-fraud/jobs/scans";

/**
 * POST /api/fraud/jobs/run-scan
 * Body: { scan: "hourly" | "cadastre" | "broker" }
 * Triggers fraud scan jobs. In production restrict to admin or cron secret.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    // In production: if (!await isAdmin(userId)) return 403;

    const body = await request.json().catch(() => ({}));
    const scan = (body.scan as string) || "hourly";

    if (scan === "hourly") {
      const result = await runHourlyListingScan();
      return Response.json({ scan: "hourly", ...result });
    }
    if (scan === "cadastre") {
      const result = await runDailyCadastreDuplicateScan();
      return Response.json({ scan: "cadastre", ...result });
    }
    if (scan === "broker") {
      const result = await runDailyBrokerActivityScan();
      return Response.json({ scan: "broker", ...result });
    }

    return Response.json({ error: "Invalid scan type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Scan failed" },
      { status: 500 }
    );
  }
}
