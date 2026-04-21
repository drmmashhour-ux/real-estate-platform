import { NextResponse } from "next/server";

import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { listingAssistantPricingService } from "@/modules/listing-assistant/listing-assistant.service";
import { logListingAssistant } from "@/modules/listing-assistant/listing-assistant.log";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** POST — suggested price band vs CRM peers — illustrative only. */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : undefined;
  const listingType = typeof body.listingType === "string" ? body.listingType.trim() : undefined;
  const currentPriceMajor =
    typeof body.currentPriceMajor === "number" && Number.isFinite(body.currentPriceMajor)
      ? body.currentPriceMajor
      : undefined;

  if (listingId && !(await canAccessCrmListingCompliance(gate.session.id, listingId))) {
    logListingAssistant("pricing_denied", { listingId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pricing = await listingAssistantPricingService({
      listingId: listingId ?? null,
      listingType,
      currentPriceMajor: currentPriceMajor ?? null,
    });
    logListingAssistant("pricing_ok", { listingId: listingId ?? null });
    return NextResponse.json(pricing);
  } catch (e) {
    logListingAssistant("pricing_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Pricing suggestion failed" }, { status: 500 });
  }
}
