import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listRegions } from "@/lib/market-intelligence";
import { REGION_TYPES } from "@/lib/market-intelligence/types";

/**
 * GET /api/market/regions
 * Query: type (city|municipality|neighborhood|postal_area), country, province, parentRegionId
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country") ?? undefined;
    const province = searchParams.get("province") ?? undefined;
    const parentRegionId = searchParams.get("parentRegionId") ?? undefined;
    const regions = await listRegions({
      ...(type && REGION_TYPES.includes(type as "city" | "municipality" | "neighborhood" | "postal_area")
        ? { regionType: type as "city" | "municipality" | "neighborhood" | "postal_area" }
        : {},
      country,
      province,
      parentRegionId: parentRegionId || undefined,
    });
    return Response.json({ regions });
  } catch (e) {
    return Response.json({ error: "Failed to list regions" }, { status: 500 });
  }
}
