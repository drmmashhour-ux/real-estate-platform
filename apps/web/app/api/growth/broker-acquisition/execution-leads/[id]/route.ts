import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import type { BrokerAcquisitionLeadStatus } from "@/modules/growth/broker-acquisition.types";
import { updateBrokerStatus } from "@/modules/growth/broker-acquisition-tracking.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

const STATUSES: BrokerAcquisitionLeadStatus[] = [
  "not_contacted",
  "contacted",
  "replied",
  "interested",
  "converted",
];

function isStatus(v: unknown): v is BrokerAcquisitionLeadStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.brokerAcquisitionV1) {
    return NextResponse.json({ error: "Broker acquisition execution is disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected object body" }, { status: 400 });
  }
  const { status, notes } = body as Record<string, unknown>;
  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const lead = updateBrokerStatus(
    id,
    status,
    typeof notes === "string" ? notes : undefined,
  );
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ lead });
}
