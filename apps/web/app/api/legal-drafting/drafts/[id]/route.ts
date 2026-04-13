import { prisma } from "@/lib/db";
import { assertDraftAccess } from "@/lib/forms/guards";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const access = await assertDraftAccess(id, auth.userId);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  const draft = await prisma.legalFormDraft.findUnique({
    where: { id },
    include: {
      template: true,
      suggestions: { orderBy: { createdAt: "desc" }, take: 100 },
      alerts: { orderBy: { createdAt: "desc" } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!draft) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ draft });
}
