import { createLead, listLeads } from "@lecipm/api/internal";
import { NextRequest, NextResponse } from "next/server";
import { recordPublicApiUsage } from "@/lib/platform/api-usage";
import { authenticatePublicApi } from "@/lib/platform/public-api-auth";
import { WEBHOOK_EVENTS, dispatchPartnerWebhook } from "@/modules/platform/webhooks";

export async function GET(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["leads:read"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/leads", "GET");
  const data = await listLeads({ partnerId: auth.partner.id });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["leads:write"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/leads", "POST");
  let body: { source?: string; status?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }
  const lead = await createLead({ partnerId: auth.partner.id }, body);
  await dispatchPartnerWebhook(auth.partner, WEBHOOK_EVENTS.LEAD_CREATED, { lead });
  return NextResponse.json({ data: lead }, { status: 201 });
}
