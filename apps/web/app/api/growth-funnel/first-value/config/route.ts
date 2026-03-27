import { NextResponse } from "next/server";
import { resolveDemoPropertyId } from "@/src/modules/growth-funnel/application/runFirstValueSimulation";

export const dynamic = "force-dynamic";

export async function GET() {
  const propertyId = await resolveDemoPropertyId(null);
  return NextResponse.json({
    propertyId,
    configured: Boolean(process.env.GROWTH_FIRST_VALUE_LISTING_ID?.trim() || propertyId),
  });
}
