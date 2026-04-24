import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import type { AmfExemptionCategory, PlatformRole } from "@prisma/client";
import { assertCapitalAccess } from "@/modules/legal-documents/legal-documents-access";
import {
  AmfExemptionWorkflowError,
  chooseExemptionForSpv,
} from "@/modules/investment-compliance/amf-exemption.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const spv = await prisma.amfSpv.findUnique({ where: { id }, select: { capitalDealId: true } });
  if (!spv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await assertCapitalAccess(spv.capitalDealId, userId, user.role as PlatformRole);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { exemption?: AmfExemptionCategory };
  if (!body.exemption) {
    return NextResponse.json({ error: "exemption required" }, { status: 400 });
  }

  try {
    await chooseExemptionForSpv({ spvId: id, exemption: body.exemption });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AmfExemptionWorkflowError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    throw e;
  }
}
