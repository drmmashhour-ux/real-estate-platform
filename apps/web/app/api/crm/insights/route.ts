import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getInsights } from "@/modules/crm/services/broker-crm-insights.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Internal CRM insight summary for dashboard. Never throws.
 */
export async function GET() {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const insights = await getInsights(
      auth.user.id,
      auth.user.role === "ADMIN",
    );
    return NextResponse.json({ ok: true, insights: insights ?? null });
  } catch {
    return NextResponse.json({ ok: true, insights: null });
  }
}
