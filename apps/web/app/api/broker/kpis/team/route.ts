import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";
import { getTeamKpiSummary } from "@/modules/broker-team-intelligence/team-kpi.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.teamKpiAggregationV1) {
    return Response.json({ error: "Team KPI aggregation disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId) {
    return Response.json({ error: "teamId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  const summary = await getTeamKpiSummary(teamId, session.userId, role);
  if (!summary) {
    return Response.json({ error: "Team not found or access denied" }, { status: 403 });
  }

  return Response.json({ summary });
}
