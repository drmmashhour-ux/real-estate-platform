import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getBrokerWorkloadSummary } from "@/modules/broker-workload/workload.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerWorkloadIntelligenceV1) {
    return Response.json({ error: "Workload intelligence disabled" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  const summary = await getBrokerWorkloadSummary(session.userId, role);
  return Response.json({ summary });
}
