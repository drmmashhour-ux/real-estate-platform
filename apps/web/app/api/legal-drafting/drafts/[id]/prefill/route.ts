import { prefillLegalFormDraft } from "@/lib/forms/ai/prefill-form";
import { assertDraftAccess } from "@/lib/forms/guards";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

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
  const result = await prefillLegalFormDraft({ draftId: id, actorUserId: auth.userId });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json(result);
}
