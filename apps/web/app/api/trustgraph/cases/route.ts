import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { findOrCreateActiveVerificationCase } from "@/lib/trustgraph/application/findOrCreateVerificationCase";
import { toVerificationCaseSummaryDto } from "@/lib/trustgraph/application/dto/verificationCaseDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { createCaseBodySchema } from "@/lib/trustgraph/infrastructure/validation/createCaseSchema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }

  const parsed = createCaseBodySchema.safeParse(json);
  if (!parsed.success) {
    return trustgraphJsonError("Validation failed", 400, parsed.error.flatten());
  }
  const body = parsed.data;

  const { case: row, created } = await findOrCreateActiveVerificationCase({
    entityType: body.entityType,
    entityId: body.entityId,
    createdBy: auth.userId,
    assignedTo: body.assignedTo ?? null,
  });

  return trustgraphJsonOk({
    case: toVerificationCaseSummaryDto(row),
    created,
    triggerSource: body.triggerSource ?? null,
  });
}
