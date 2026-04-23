import { prisma } from "@repo/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { toTrustProfileDto } from "@/lib/trustgraph/application/dto/trustProfileDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { trustProfileParamsSchema } from "@/lib/trustgraph/infrastructure/validation/trustProfileParamsSchema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ subjectType: string; subjectId: string }> }
) {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const raw = await context.params;
  const parsed = trustProfileParamsSchema.safeParse({ subjectType: raw.subjectType, subjectId: raw.subjectId });
  if (!parsed.success) {
    return trustgraphJsonError("Invalid parameters", 400, parsed.error.flatten());
  }

  const { subjectType, subjectId } = parsed.data;

  const profile = await prisma.trustProfile.findUnique({
    where: { subjectType_subjectId: { subjectType, subjectId } },
  });

  if (!profile) {
    return trustgraphJsonOk({ profile: null });
  }

  return trustgraphJsonOk({ profile: toTrustProfileDto(profile) });
}
