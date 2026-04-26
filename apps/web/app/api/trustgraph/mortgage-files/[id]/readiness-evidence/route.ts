import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isTrustGraphDocExtractionEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { z } from "zod";
import type { MortgageReadinessEvidenceSafeDto } from "@/lib/trustgraph/application/dto/phase6StatusDto";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphDocExtractionEnabled()) {
    return trustgraphJsonError("Document extraction disabled", 503);
  }

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid id", 400, parsed.error.flatten());

  const userId = await getGuestId();
  if (!userId) return trustgraphJsonError("Unauthorized", 401);

  const row = await prisma.mortgageRequest.findUnique({
    where: { id: parsed.data.id },
    select: { userId: true },
  });
  if (!row) return trustgraphJsonError("Not found", 404);

  const admin = await isPlatformAdmin(userId);
  if (!admin && row.userId !== userId) return trustgraphJsonError("Forbidden", 403);

  const rec = await prisma.trustgraphExtractedDocumentRecord.findFirst({
    where: { job: { mortgageFileId: parsed.data.id } },
    orderBy: { updatedAt: "desc" },
    select: { confidence: true, extractionStatus: true, normalizedPayload: true },
  });

  const safe: MortgageReadinessEvidenceSafeDto = {
    extractionConfidence: rec?.confidence ?? null,
    reviewRecommended: rec?.extractionStatus === "needs_review" || (rec?.confidence ?? 0) < 0.45,
  };

  return trustgraphJsonOk({
    safe,
    ...(admin ? { admin: { normalizedPayload: rec?.normalizedPayload ?? null } } : {}),
  });
}
