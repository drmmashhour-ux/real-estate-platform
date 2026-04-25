import { brokerResidentialFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getResidentialKnowledgeIndex } from "@/modules/broker-residential-knowledge/residential-knowledge.service";
import { listLegalSourceCatalog } from "@/modules/legal-knowledge/legal-knowledge.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;

  if (!brokerResidentialFlags.residentialKnowledgeHooksV1) {
    return Response.json({ error: "Knowledge hooks disabled" }, { status: 403 });
  }

  const [index, catalog] = await Promise.all([getResidentialKnowledgeIndex(), listLegalSourceCatalog(40)]);

  return Response.json({
    ...index,
    knowledgeDocumentsCatalog: catalog,
  });
}
