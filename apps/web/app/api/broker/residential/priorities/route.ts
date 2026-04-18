import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getResidentialDashboardPayload } from "@/modules/broker-residential-copilot/broker-residential-copilot.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession({ requireDashboardFlag: true });
  if ("response" in session) return session.response;
  const url = new URL(request.url);
  const basePath = url.searchParams.get("basePath") ?? "/broker/residential";
  const { priorities, generatedAt, disclaimer } = await getResidentialDashboardPayload(session.userId, basePath);
  return Response.json({ priorities, generatedAt, disclaimer });
}
