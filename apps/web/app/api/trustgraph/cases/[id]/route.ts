import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { toVerificationCaseDetailDto } from "@/lib/trustgraph/application/dto/verificationCaseDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { runCaseParamsSchema } from "@/lib/trustgraph/infrastructure/validation/runCaseSchema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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

  const c = await prisma.verificationCase.findUnique({
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
  if (!c) return trustgraphJsonError("Not found", 404);

  const dto = toVerificationCaseDetailDto({
    case: c,
    signals: c.signals,
    ruleResults: c.ruleResults,
    nextBestActions: c.nextBestActions,
    reviewActions: c.reviewActions,
    links: c.links,
  });

  return trustgraphJsonOk({ case: dto });
}
