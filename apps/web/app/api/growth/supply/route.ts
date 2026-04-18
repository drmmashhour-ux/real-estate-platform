import { NextResponse } from "next/server";
import { buildSupplyAcquisitionBundle } from "@/modules/supply-acquisition/supply-acquisition.service";
import { requireMontrealGrowthAdmin } from "@/lib/growth/montreal-growth-api-auth";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireMontrealGrowthAdmin();
  if (!auth.ok) return auth.response;
  if (!montrealGrowthEngineFlags.supplyAcquisitionV1) {
    return NextResponse.json({ error: "Supply acquisition module disabled" }, { status: 403 });
  }

  const bundle = await buildSupplyAcquisitionBundle();
  return NextResponse.json({ bundle });
}
