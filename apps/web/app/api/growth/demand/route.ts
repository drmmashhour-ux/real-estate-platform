import { NextResponse } from "next/server";
import { buildDemandAcquisitionSnapshot } from "@/modules/demand-acquisition/demand-acquisition.service";
import { requireMontrealGrowthAdmin } from "@/lib/growth/montreal-growth-api-auth";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireMontrealGrowthAdmin();
  if (!auth.ok) return auth.response;
  if (!montrealGrowthEngineFlags.demandAcquisitionV1) {
    return NextResponse.json({ error: "Demand acquisition module disabled" }, { status: 403 });
  }

  const snapshot = await buildDemandAcquisitionSnapshot();
  return NextResponse.json({ snapshot });
}
