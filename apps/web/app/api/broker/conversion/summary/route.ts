import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getBrokerConversionHomeSummary } from "@/modules/brokers/broker-conversion.service";

export const dynamic = "force-dynamic";

/** GET — home dashboard: top opportunities, risk counts, first-purchase hint (for CRM home). */
export async function GET() {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const summary = await getBrokerConversionHomeSummary(auth.user.id, auth.user.role === "ADMIN");
  return NextResponse.json(summary);
}
