import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { suggestRebalance } from "@/modules/broker-workload/workload-balancer.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerWorkloadIntelligenceV1) {
    return Response.json({ error: "Workload intelligence disabled" }, { status: 403 });
  }

  const suggestions = await suggestRebalance(session.userId);
  return Response.json({ suggestions });
}
