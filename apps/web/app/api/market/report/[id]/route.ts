import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getReport, listReports } from "@/lib/market-intelligence";

/**
 * GET /api/market/report/:id (id = regionId). Query: period (optional), limit (for list)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: regionId } = await context.params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? undefined;
    const limit = Number(searchParams.get("limit")) || 12;
    if (period) {
      const report = await getReport(regionId, period);
      if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
      return Response.json(report);
    }
    const reports = await listReports(regionId, limit);
    return Response.json({ reports });
  } catch (e) {
    return Response.json({ error: "Failed to load report" }, { status: 500 });
  }
}
