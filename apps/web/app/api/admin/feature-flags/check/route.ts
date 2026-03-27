import { NextRequest } from "next/server";
import { isFeatureEnabled } from "@/lib/operational-controls";

/** GET: check if feature is enabled (?key=instant_booking&region=CA). */
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    const region = request.nextUrl.searchParams.get("region") ?? undefined;
    if (!key) {
      return Response.json({ error: "key required" }, { status: 400 });
    }
    const enabled = await isFeatureEnabled(key, { region });
    return Response.json({ key, enabled, region });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to check feature flag" }, { status: 500 });
  }
}
