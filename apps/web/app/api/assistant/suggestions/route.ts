import { NextResponse } from "next/server";

import { getBrokerAssistantSuggestions } from "@/modules/assistant/assistant.service";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/assistant/suggestions — coaching hints for brokers (display only; never sends messages).
 * Query: dealId?, leadId?
 */
export async function GET(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const dealId = url.searchParams.get("dealId")?.trim() || undefined;
  const leadId = url.searchParams.get("leadId")?.trim() || undefined;

  const { suggestions, disclaimer } = await getBrokerAssistantSuggestions({
    brokerUserId: gate.session.id,
    dealId,
    leadId,
  });

  return NextResponse.json({ suggestions, disclaimer });
}
