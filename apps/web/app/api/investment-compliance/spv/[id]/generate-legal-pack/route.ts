import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import type { PlatformRole } from "@prisma/client";
import { assertCapitalAccess } from "@/modules/legal-documents/legal-documents-access";
import { generateLegalPackForSpv } from "@/modules/investment-compliance/amf-exemption.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const spv = await prisma.amfSpv.findUnique({
    where: { id },
    select: { capitalDealId: true, exemptionPath: true },
  });
  if (!spv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!spv.exemptionPath) {
    return NextResponse.json({ error: "Choose an exemption path before generating the legal pack." }, { status: 400 });
  }

  try {
    await assertCapitalAccess(spv.capitalDealId, userId, user.role as PlatformRole);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pack = await generateLegalPackForSpv({
    spvId: id,
    capitalDealId: spv.capitalDealId,
    exemption: spv.exemptionPath,
  });

  return NextResponse.json(pack);
}
