import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import type { BrokerChannel } from "@/modules/growth/broker-acquisition.types";
import {
  createBrokerLead,
  listBrokerLeads,
} from "@/modules/growth/broker-acquisition-tracking.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

const CHANNELS: BrokerChannel[] = ["instagram", "linkedin", "facebook", "direct_call"];

function isChannel(v: unknown): v is BrokerChannel {
  return typeof v === "string" && (CHANNELS as string[]).includes(v);
}

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.brokerAcquisitionV1) {
    return NextResponse.json({ error: "Broker acquisition execution is disabled" }, { status: 403 });
  }

  return NextResponse.json({ leads: listBrokerLeads() });
}

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.brokerAcquisitionV1) {
    return NextResponse.json({ error: "Broker acquisition execution is disabled" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected object body" }, { status: 400 });
  }
  const { name, channel, notes } = body as Record<string, unknown>;
  if (!isChannel(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const lead = createBrokerLead({
    name: typeof name === "string" ? name : undefined,
    channel,
    notes: typeof notes === "string" ? notes : undefined,
  });
  return NextResponse.json({ lead });
}
