import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { runVerificationPipelineForCase } from "@/lib/trustgraph/application/runVerificationPipeline";
import { toVerificationCaseDetailDto } from "@/lib/trustgraph/application/dto/verificationCaseDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { runCaseParamsSchema } from "@/lib/trustgraph/infrastructure/validation/runCaseSchema";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const parsed = runCaseParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return trustgraphJsonError("Invalid case id", 400, parsed.error.flatten());
  }

  const res = await runVerificationPipelineForCase({
    caseId: parsed.data.id,
    actorUserId: auth.userId,
  });
  if (!res.ok) {
    return trustgraphJsonError(res.error, 400);
  }

  const fresh = await prisma.verificationCase.findUnique({
    where: { id: parsed.data.id },
    include: {
      signals: { orderBy: { createdAt: "desc" } },
      ruleResults: { orderBy: { createdAt: "desc" } },
      nextBestActions: { orderBy: { createdAt: "desc" } },
      reviewActions: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { id: true, email: true } } },
      },
      links: true,
    },
  });
  if (!fresh) {
    return trustgraphJsonError("Case not found after run", 500);
  }

  const dto = toVerificationCaseDetailDto({
    case: fresh,
    signals: fresh.signals,
    ruleResults: fresh.ruleResults,
    nextBestActions: fresh.nextBestActions,
    reviewActions: fresh.reviewActions,
    links: fresh.links,
  });

  return trustgraphJsonOk({ ok: true, case: dto });
}
