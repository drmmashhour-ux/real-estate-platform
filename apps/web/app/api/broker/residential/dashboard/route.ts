import { brokerResidentialFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getResidentialDashboardPayload } from "@/modules/broker-residential-copilot/broker-residential-copilot.service";
import { getResidentialKnowledgeIndex } from "@/modules/broker-residential-knowledge/residential-knowledge.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession({ requireDashboardFlag: true });
  if ("response" in session) return session.response;
  if (!brokerResidentialFlags.brokerResidentialDashboardV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const basePath = url.searchParams.get("basePath") ?? "";

  const [dashboard, knowledge] = await Promise.all([
    getResidentialDashboardPayload(session.userId, basePath || "/broker/residential"),
    brokerResidentialFlags.residentialKnowledgeHooksV1 ? getResidentialKnowledgeIndex() : Promise.resolve(null),
  ]);

  return Response.json({ dashboard, knowledge });
}
