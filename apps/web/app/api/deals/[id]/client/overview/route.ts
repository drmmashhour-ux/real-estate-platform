import { findDealForParticipant } from "@/lib/deals/execution-access";
import { getGuestId } from "@/lib/auth/session";
import { requireClientDealViewV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { normalizeState } from "@/modules/execution/execution-state-machine";
import { listConditions } from "@/modules/deal-execution/condition-tracker.service";
import { dealTransactionFlags, productionPipelineFlags } from "@/config/feature-flags";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";

export const dynamic = "force-dynamic";

/** Read-only summary for buyers/sellers — no broker-only fields. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClientDealViewV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await findDealForParticipant(dealId, userId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      dealCode: true,
      priceCents: true,
      lecipmExecutionPipelineState: true,
      status: true,
      createdAt: true,
    },
  });
  const conditions = await listConditions(dealId);

  let signature: Awaited<ReturnType<typeof getLatestSignatureSummary>> = null;
  if (dealTransactionFlags.signatureSystemV1) {
    signature = await getLatestSignatureSummary(dealId);
  }

  let notaryAppointment: string | null = null;
  if (productionPipelineFlags.notarySystemV1) {
    const nc = await prisma.dealNotaryCoordination.findUnique({
      where: { dealId },
      select: { appointmentAt: true, notaryInviteStatus: true },
    });
    notaryAppointment = nc?.appointmentAt?.toISOString() ?? null;
  }

  return Response.json({
    dealId,
    dealCode: full?.dealCode,
    priceCents: full?.priceCents,
    pipelineState: normalizeState(full?.lecipmExecutionPipelineState),
    dealStatus: full?.status,
    conditions,
    signature,
    notaryAppointmentAt: notaryAppointment,
    disclaimer: "Summary only — not legal advice. Official execution follows your broker and applicable rules.",
  });
}
