import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { ingestWebhookLead } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

/**
 * Secondary ingress for webhooks proxied through Edge (body already verified upstream).
 * Prefer Next `/api/webhooks/bnhub-growth/*` for direct Meta/Google/TikTok.
 */
export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as {
    connectorCode: string;
    payload: Record<string, unknown>;
  };
  const p = body.payload;
  if (body.connectorCode === "meta_ads") {
    const lead = await ingestWebhookLead({
      sourceType: "META_LEAD",
      sourceConnectorCode: "meta_ads",
      externalLeadRef: typeof p.leadgen_id === "string" ? p.leadgen_id : undefined,
      fullName: typeof p.full_name === "string" ? p.full_name : null,
      email: typeof p.email === "string" ? p.email : null,
      phone: typeof p.phone_number === "string" ? p.phone_number : null,
      message: JSON.stringify(p).slice(0, 2000),
    });
    return Response.json({ ok: true, leadId: lead.id });
  }
  if (body.connectorCode === "google_ads") {
    const lead = await ingestWebhookLead({
      sourceType: "GOOGLE_LEAD",
      sourceConnectorCode: "google_ads",
      externalLeadRef: typeof p.lead_id === "string" ? p.lead_id : undefined,
      fullName: typeof p.name === "string" ? p.name : null,
      email: typeof p.email === "string" ? p.email : null,
      phone: typeof p.phone === "string" ? p.phone : null,
      message: JSON.stringify(p).slice(0, 2000),
    });
    return Response.json({ ok: true, leadId: lead.id });
  }
  if (body.connectorCode === "tiktok_ads") {
    const lead = await ingestWebhookLead({
      sourceType: "TIKTOK_LEAD",
      sourceConnectorCode: "tiktok_ads",
      externalLeadRef: typeof p.lead_id === "string" ? p.lead_id : undefined,
      fullName: typeof p.name === "string" ? p.name : null,
      email: typeof p.email === "string" ? p.email : null,
      message: JSON.stringify(p).slice(0, 2000),
    });
    return Response.json({ ok: true, leadId: lead.id });
  }
  return Response.json({ error: "Unsupported connectorCode" }, { status: 400 });
}
