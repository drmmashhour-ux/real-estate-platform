import { applyHumanReviewAction } from "@/lib/trustgraph/application/applyHumanReviewAction";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphReviewer } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphReviewer";
import { reviewActionBodySchema } from "@/lib/trustgraph/infrastructure/validation/reviewActionSchema";
import { runCaseParamsSchema } from "@/lib/trustgraph/infrastructure/validation/runCaseSchema";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }
  const auth = await requireTrustgraphReviewer();
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const parsedId = runCaseParamsSchema.safeParse({ id });
  if (!parsedId.success) {
    return trustgraphJsonError("Invalid case id", 400, parsedId.error.flatten());
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }
  const parsed = reviewActionBodySchema.safeParse(json);
  if (!parsed.success) {
    return trustgraphJsonError("Validation failed", 400, parsed.error.flatten());
  }

  const { actionType, notes, payload, newOverallScore } = parsed.data;

  try {
    await applyHumanReviewAction({
      caseId: parsedId.data.id,
      reviewerId: auth.userId,
      actionType,
      notes: notes ?? null,
      payload: (payload ?? {}) as Record<string, unknown>,
      newOverallScore,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return trustgraphJsonError(msg, 400);
  }

  return trustgraphJsonOk({ ok: true });
}
