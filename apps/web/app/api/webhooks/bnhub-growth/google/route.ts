import { NextRequest } from "next/server";
import { ingestWebhookLead } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

/** Google Ads lead form webhook — token required when GOOGLE_LEAD_WEBHOOK_TOKEN is set; in production without it, disabled. */
export async function POST(request: NextRequest) {
  const expected = process.env.GOOGLE_LEAD_WEBHOOK_TOKEN;
  const token = request.nextUrl.searchParams.get("token") ?? request.headers.get("x-google-token");

  if (expected) {
    if (token !== expected) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "GOOGLE_LEAD_WEBHOOK_TOKEN not configured — webhook disabled in production" },
      { status: 501 }
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const lead = await ingestWebhookLead({
    sourceType: "GOOGLE_LEAD",
    sourceConnectorCode: "google_ads",
    externalLeadRef: typeof body.lead_id === "string" ? body.lead_id : undefined,
    fullName: typeof body.name === "string" ? body.name : null,
    email: typeof body.email === "string" ? body.email : null,
    phone: typeof body.phone === "string" ? body.phone : null,
    message: JSON.stringify(body).slice(0, 2000),
  });
  return Response.json({ ok: true, leadId: lead.id, verified: Boolean(expected) });
}
