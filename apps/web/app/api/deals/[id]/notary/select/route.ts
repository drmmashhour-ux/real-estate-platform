import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNotarySystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getNotaryById } from "@/modules/notary/notary.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNotarySystemV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { notaryId?: string };
  if (!body.notaryId) {
    return Response.json({ error: "notaryId required" }, { status: 400 });
  }

  const n = await getNotaryById(body.notaryId);
  if (!n) return Response.json({ error: "Notary not found" }, { status: 404 });

  await prisma.dealNotaryCoordination.upsert({
    where: { dealId },
    create: {
      dealId,
      notaryId: body.notaryId,
      selectedAt: new Date(),
      notaryInviteStatus: "pending",
    },
    update: {
      notaryId: body.notaryId,
      selectedAt: new Date(),
      notaryInviteStatus: "pending",
    },
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId,
      actorUserId: auth.userId,
      actionKey: "notary_selected",
      payload: { notaryId: body.notaryId },
    },
  });

  return Response.json({ ok: true });
}
