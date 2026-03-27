import { NextRequest } from "next/server";
import { getActiveAiAlerts, runMarketplaceHealthChecks } from "@/lib/ai-marketplace-health";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const run = searchParams.get("run") === "true";
    if (run) {
      const result = await runMarketplaceHealthChecks();
      return Response.json(result);
    }
    const alerts = await getActiveAiAlerts(50);
    return Response.json(alerts);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get alerts" }, { status: 500 });
  }
}
