import { NextRequest, NextResponse } from "next/server";
import { runAutonomyForListing } from "@/lib/ai/autonomy-run";
import { getListingsForAutopilot } from "@/lib/ai/listings-for-autopilot";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/autopilot — schedule every 6–12h via cron. `Authorization: Bearer $CRON_SECRET`.
 * Optional JSON: `{ "take": 30 }` (capped in `getListingsForAutopilot`).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let take = 30;
  try {
    const body = (await request.json().catch(() => ({}))) as { take?: unknown };
    if (typeof body?.take === "number" && Number.isFinite(body.take)) {
      take = body.take;
    }
  } catch {
    /* default take */
  }

  const listings = await getListingsForAutopilot({ take });
  const results: {
    id: string;
    flags: string[];
    executeResult: string;
    executed: boolean;
    demo?: true;
  }[] = [];
  for (const l of listings) {
    try {
      const r = await runAutonomyForListing(l, {
        marketplaceListingId: l.id,
        crmListingId: l.id,
      });
      results.push({
        id: l.id,
        flags: r.flags,
        executeResult: r.executeResult,
        executed: r.executed,
        ...(r._demo ? { demo: true } : {}),
      });
    } catch (e) {
      logError(e, { route: "/api/ai/autopilot", listingId: l.id });
      results.push({
        id: l.id,
        flags: [],
        executeResult: "error",
        executed: false,
      });
    }
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}
