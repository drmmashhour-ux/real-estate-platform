import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

/** DELETE — void / remove generated tax document record (regenerate if needed) */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await prisma.taxDocument.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const before = { id: existing.id, documentType: existing.documentType, status: existing.status };

  await prisma.taxDocument.delete({ where: { id } });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "tax_doc_deleted",
    entityType: "TaxDocument",
    entityId: id,
    ipAddress: ip,
    metadata: { before, after: null },
  });

  return Response.json({ ok: true });
}
