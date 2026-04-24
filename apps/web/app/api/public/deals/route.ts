import { listDeals, updateDealStage } from "@lecipm/api/internal";
import { NextRequest, NextResponse } from "next/server";
import { recordPublicApiUsage } from "@/lib/platform/api-usage";
import { authenticatePublicApi } from "@/lib/platform/public-api-auth";
import { WEBHOOK_EVENTS, dispatchPartnerWebhook } from "@/modules/platform/webhooks";

export async function GET(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["deals:read"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/deals", "GET");
  const data = await listDeals({ partnerId: auth.partner.id });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["deals:write"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/deals", "PATCH");

  const url = new URL(req.url);
  let id = url.searchParams.get("id");
  let stage = url.searchParams.get("stage");

  if (!id || !stage) {
    try {
      const body = (await req.json()) as { id?: string; stage?: string };
      id = id ?? body.id ?? null;
      stage = stage ?? body.stage ?? null;
    } catch {
      /* optional body */
    }
  }

  if (!id || !stage) {
    return NextResponse.json({ error: "Provide id and stage (query or JSON body)." }, { status: 400 });
  }

  const deal = await updateDealStage({ partnerId: auth.partner.id }, id, stage);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  await dispatchPartnerWebhook(auth.partner, WEBHOOK_EVENTS.DEAL_UPDATED, { deal });
  return NextResponse.json({ data: deal });
}
