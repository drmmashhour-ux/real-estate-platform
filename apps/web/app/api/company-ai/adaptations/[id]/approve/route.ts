import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyAiAdmin } from "@/modules/company-ai/company-ai-api-guard";
import { logCompanyAiAudit } from "@/modules/company-ai/company-ai-audit.service";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireCompanyAiAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const row = await prisma.companyAdaptationEvent.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "PROPOSED") {
    return NextResponse.json({ error: "Only PROPOSED adaptations can be approved" }, { status: 400 });
  }

  const now = new Date();
  await prisma.companyAdaptationEvent.update({
    where: { id },
    data: {
      status: "ROLLED_OUT",
      approvedAt: now,
      approvedByUserId: auth.userId,
    },
  });

  await logCompanyAiAudit({
    action: "adaptation_approved",
    actorUserId: auth.userId,
    payload: { adaptationId: id, domain: row.domain, adaptationType: row.adaptationType },
  });

  return NextResponse.json({ ok: true, id, status: "ROLLED_OUT" });
}
