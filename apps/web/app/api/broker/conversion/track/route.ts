import { NextRequest, NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { recordBrokerConversionEvent } from "@/modules/brokers/broker-conversion.service";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<
  Parameters<typeof recordBrokerConversionEvent>[0]["eventType"]
>([
  "broker_conversion_crm_view",
  "broker_conversion_unlock_click",
  "broker_conversion_detail_open",
]);

/** POST — lightweight funnel events (rate-limited by auth; no spam). */
export async function POST(req: NextRequest) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as {
    eventType?: string;
    crmLeadId?: string;
    marketplaceLeadId?: string;
  };

  const eventType = body.eventType as Parameters<typeof recordBrokerConversionEvent>[0]["eventType"];
  if (!eventType || !ALLOWED.has(eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  await recordBrokerConversionEvent({
    brokerId: auth.user.id,
    eventType,
    crmLeadId: typeof body.crmLeadId === "string" ? body.crmLeadId : undefined,
    marketplaceLeadId: typeof body.marketplaceLeadId === "string" ? body.marketplaceLeadId : undefined,
  });

  return NextResponse.json({ ok: true });
}
