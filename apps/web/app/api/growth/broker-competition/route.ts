import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildBrokerCompetitionProfiles } from "@/modules/brokers/broker-competition.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.brokerCompetitionV1) {
    return NextResponse.json({ error: "Broker competition disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const profiles = await buildBrokerCompetitionProfiles();
    return NextResponse.json({
      profiles,
      note: "Read-only rankings from monetization signals — not a guarantee of future closes.",
    });
  } catch (e) {
    console.error("[growth/broker-competition]", e);
    return NextResponse.json({ error: "Failed to load broker competition" }, { status: 500 });
  }
}
