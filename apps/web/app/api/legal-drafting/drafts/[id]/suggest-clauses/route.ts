import { suggestClausesForDraft } from "@/lib/forms/ai/suggest-clauses";
import { assertDraftAccess } from "@/lib/forms/guards";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const access = await assertDraftAccess(id, auth.userId);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }
  const draft = await prisma.legalFormDraft.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!draft) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const result = await suggestClausesForDraft({
    draftId: id,
    actorUserId: auth.userId,
    templateKey: draft.template.key,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json(result);
}
