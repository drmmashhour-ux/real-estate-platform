import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import type { PlatformRole } from "@prisma/client";
import { assertCapitalAccess } from "@/modules/legal-documents/legal-documents-access";
import { markForm45106Filed } from "@/modules/investment-compliance/amf-exemption.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: spvId } = await ctx.params;
  const spv = await prisma.amfSpv.findUnique({ where: { id: spvId }, select: { capitalDealId: true } });
  if (!spv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await assertCapitalAccess(spv.capitalDealId, userId, user.role as PlatformRole);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { exemptFileId?: string };
  if (!body.exemptFileId) {
    return NextResponse.json({ error: "exemptFileId required" }, { status: 400 });
  }

  const file = await prisma.exemptDistributionFile.findFirst({
    where: { id: body.exemptFileId, spvId },
  });
  if (!file) return NextResponse.json({ error: "Exempt file not found for SPV" }, { status: 404 });

  await markForm45106Filed(file.id);
  return NextResponse.json({ ok: true });
}
