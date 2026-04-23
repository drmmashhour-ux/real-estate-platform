import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** Broker, buyer, or seller on the deal — latest signature session summary + optional provider ref. */
export async function GET(request: Request) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const dealId = new URL(request.url).searchParams.get("dealId");
  if (!dealId) {
    return Response.json({ error: "dealId query required" }, { status: 400 });
  }

  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const summary = await getLatestSignatureSummary(dealId);
  const session = summary
    ? await prisma.signatureSession.findUnique({
        where: { id: summary.sessionId },
        select: { providerSessionId: true, providerMetadata: true, updatedAt: true },
      })
    : null;

  return Response.json({
    summary,
    providerSessionId: session?.providerSessionId ?? null,
    providerMetadata: session?.providerMetadata ?? null,
    updatedAt: session?.updatedAt ?? null,
  });
}
