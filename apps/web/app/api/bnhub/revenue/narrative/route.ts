import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";

export const dynamic = "force-dynamic";

/**
 * GET — rules-based (deterministic) host revenue narrative; requires signed-in host.
 * Append `?persist=0` to rebuild without writing `BnhubDashboardNarrativeSnapshot`.
 */
export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const persist = new URL(req.url).searchParams.get("persist") !== "0";

  try {
    const narrative = await generateHostRevenueNarrative(userId, { persist });
    return NextResponse.json({
      success: true,
      narrative,
      deterministic: true,
      source: "rules_engine_v1",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate narrative";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
