import { NextRequest, NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { convertBrokerCrmLeadToDeal } from "@/modules/crm/lead-to-deal.converter";
import { logLeadToDealConversion } from "@/modules/crm/services/broker-crm-outcome.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Suggestion-side conversion path: create Deal from eligible broker CRM lead, update lead stage. No auto-messaging. Never throws.
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

    const result = await convertBrokerCrmLeadToDeal({
      brokerCrmLeadId: leadId,
      brokerUserId: auth.user.id,
      priceDollars,
    });

    if (result.ok) {
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

    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "convert_unavailable" }, { status: 200 });
  }
}
