import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { fetchLecipmLeadSummaries } from "@/lib/visits/lead-summaries";
import { listVisitDataForBrokerDashboard } from "@/lib/visits/list-for-broker";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { pendingRequests, upcomingVisits, pastVisits } = await listVisitDataForBrokerDashboard(auth.user.id);

  const leadIds = [
    ...pendingRequests.map((r) => r.leadId),
    ...upcomingVisits.map((v) => v.visitRequest.leadId),
    ...pastVisits.map((v) => v.visitRequest.leadId),
  ];
  const leadSummaries = await fetchLecipmLeadSummaries(leadIds);

  return NextResponse.json({
    pendingRequests,
    upcomingVisits,
    pastVisits,
    leadSummaries: Object.fromEntries(leadSummaries),
  });
}
