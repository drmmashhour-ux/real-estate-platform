import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { getBrokerAcquisitionScripts } from "@/modules/growth/broker-acquisition.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.brokerAcquisitionV1) {
    return NextResponse.json({ error: "Broker acquisition execution is disabled" }, { status: 403 });
  }

  return NextResponse.json({ scripts: getBrokerAcquisitionScripts() });
}
