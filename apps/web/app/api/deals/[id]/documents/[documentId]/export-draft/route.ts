import { prisma } from "@repo/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { logContractEngineEvent } from "@/lib/contract-engine/events";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { generateDraftArtifacts } from "@/modules/document-generation/document-generation.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;
  if (!aiContractEngineFlags.draftExportV1) return Response.json({ error: "Draft export disabled" }, { status: 403 });

  const { id: dealId, documentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const doc = await prisma.dealDocument.findFirst({ where: { id: documentId, dealId } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { dealParties: true } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const formKey = doc.templateKey ?? "pp_mandatory_residential_immovable";
  const artifacts = await generateDraftArtifacts(deal, formKey);
  if ("error" in artifacts) return Response.json(artifacts, { status: 400 });

  void logContractEngineEvent("draft_exported", auth.userId, dealId, { documentId });
  return Response.json({ artifacts, draftNotice: "Draft assistance — broker review required." });
}
