import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";

export const dynamic = "force-dynamic";

/** Alias of `GET /api/bnhub/revenue/narrative` — persists a snapshot row unless you add `?persist=0`. */
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
