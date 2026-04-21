import { NextResponse } from "next/server";

import { listingAssistantComplianceService } from "@/modules/listing-assistant/listing-assistant.service";
import { logComplianceCheck } from "@/modules/listing-assistant/listing-assistant.log";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** POST — compliance-only on arbitrary draft text (broker-reviewed). */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : undefined;
  const description = typeof body.description === "string" ? body.description : undefined;
  const highlights = Array.isArray(body.highlights)
    ? body.highlights.filter((x): x is string => typeof x === "string")
    : undefined;

  try {
    const compliance = await listingAssistantComplianceService({
      title,
      description,
      highlights,
    });
    logComplianceCheck("api_ok", {
      compliant: compliance.compliant,
      riskLevel: compliance.riskLevel,
    });
    return NextResponse.json(compliance);
  } catch (e) {
    logComplianceCheck("api_error", { err: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
