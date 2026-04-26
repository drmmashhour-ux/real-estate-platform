import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphMortgageAutopilotEnabled } from "@/lib/trustgraph/feature-flags";
import { toMortgageReadinessDtos } from "@/lib/trustgraph/application/dto/mortgageReadinessDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphMortgageAutopilotEnabled()) {
    return trustgraphJsonError("Mortgage readiness autopilot disabled", 503);
  }

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return trustgraphJsonError("Invalid id", 400, parsed.error.flatten());
  }

  const userId = await getGuestId();
  if (!userId) {
    return trustgraphJsonError("Unauthorized", 401);
  }

  const row = await prisma.mortgageRequest.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true },
  });
  if (!row) {
    return trustgraphJsonError("Not found", 404);
  }

  const admin = await isPlatformAdmin(userId);
  if (!admin && row.userId !== userId) {
    return trustgraphJsonError("Forbidden", 403);
  }

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "MORTGAGE_FILE", entityId: row.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, overallScore: true, readinessLevel: true },
  });

  const failed = c
    ? await prisma.verificationRuleResult.findMany({
        where: { caseId: c.id, passed: false },
        select: { ruleCode: true },
      })
    : [];

  const dtos = toMortgageReadinessDtos({
    readinessLevel: c?.readinessLevel ?? null,
    overallScore: c?.overallScore ?? null,
    failedRuleCodes: failed.map((f) => f.ruleCode),
  });

  return trustgraphJsonOk({
    safe: dtos.safe,
    ...(admin ? { admin: dtos.admin } : {}),
  });
}
