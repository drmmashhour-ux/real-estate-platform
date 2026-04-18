import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildBrokerLockInSignals } from "@/modules/brokers/broker-lockin.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.brokerLockinV1) {
    return NextResponse.json({ error: "Broker lock-in disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const signals = await buildBrokerLockInSignals();
    return NextResponse.json({
      signals,
      note:
        "Advisory dependency indices from the same read-only monetization summaries as broker competition — not a promise of outcomes.",
    });
  } catch (e) {
    console.error("[growth/broker-lockin]", e);
    return NextResponse.json({ error: "Failed to load broker lock-in signals" }, { status: 500 });
  }
}
