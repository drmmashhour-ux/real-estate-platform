import { NextRequest } from "next/server";
import { getRevenueSummary, getRevenueLedger } from "@/lib/revenue-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // summary | ledger
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");
    const marketId = searchParams.get("marketId") ?? undefined;
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    if (type === "ledger") {
      const start = periodStart ? new Date(periodStart) : undefined;
      const end = periodEnd ? new Date(periodEnd) : undefined;
      const result = await getRevenueLedger({
        periodStart: start,
        periodEnd: end,
        marketId,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      return Response.json(result);
    }

    const start = periodStart ? new Date(periodStart) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const end = periodEnd ? new Date(periodEnd) : new Date();
    const summary = await getRevenueSummary({
      periodStart: start,
      periodEnd: end,
      marketId,
    });
    return Response.json(summary);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
