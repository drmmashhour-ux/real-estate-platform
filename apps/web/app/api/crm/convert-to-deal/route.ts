import { NextRequest, NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { crmLog } from "@/modules/crm/crm-pipeline-logger";
import { convertBrokerCrmLeadToDeal } from "@/modules/crm/lead-to-deal.converter";
import { logLeadToDealConversion } from "@/modules/crm/services/broker-crm-outcome.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * STEP 3 — Lead → deal (suggest-side). Body: `{ leadId }` required; optional `priceDollars`, `idempotencyKey`.
 * Validates scope, prevents duplicate deal for same lead (idempotent), updates lead toward negotiating, `[crm]` logs.
 * No auto-messaging. Never throws from handler.
 */
export async function POST(req: NextRequest) {
  let body: { leadId?: string; priceDollars?: number; idempotencyKey?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const leadId = String(body?.leadId ?? "").trim();
  if (!leadId) {
    return NextResponse.json({ ok: false, error: "leadId_required" }, { status: 400 });
  }

  const priceRaw = Number(body?.priceDollars);
  const priceDollars = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 1;

  try {
    const lead = await findLeadForBrokerScope(leadId, auth.user.id, auth.user.role);
    if (!lead) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    crmLog.info("convert_to_deal_attempt", { leadId, brokerUserId: auth.user.id });
    const result = await convertBrokerCrmLeadToDeal({
      brokerCrmLeadId: leadId,
      brokerUserId: auth.user.id,
      priceDollars,
    });

    if (result.ok) {
      crmLog.info("convert_to_deal_success", { leadId, dealId: result.deal.id });
      void logLeadToDealConversion({
        leadId,
        dealId: result.deal.id,
        brokerUserId: auth.user.id,
      });
      return NextResponse.json({
        ok: true,
        dealId: result.deal.id,
        dealCode: result.deal.dealCode,
        idempotencyKey: body.idempotencyKey ?? null,
      });
    }

    crmLog.warn("convert_to_deal_blocked", { leadId, reason: result.reason });
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  } catch {
    crmLog.warn("convert_to_deal_error", { leadId });
    return NextResponse.json({ ok: false, error: "convert_unavailable" }, { status: 200 });
  }
}
