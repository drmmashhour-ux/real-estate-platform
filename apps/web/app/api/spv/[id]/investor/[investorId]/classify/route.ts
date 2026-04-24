import { NextResponse } from "next/server";
import { AmfExemptionCategory, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { classifyInvestorForPrivatePlacement } from "@/modules/amf-private-placement/amf-private-placement.service";

export const dynamic = "force-dynamic";

const EXEMPTION_VALUES = new Set<string>(Object.values(AmfExemptionCategory));

export async function POST(request: Request, context: { params: Promise<{ id: string; investorId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: spvId, investorId } = await context.params;

  let body: {
    exemptionType?: string;
    jurisdiction?: string;
    questionnaireJson?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const exemptionType = body.exemptionType as AmfExemptionCategory;
  if (!exemptionType || !EXEMPTION_VALUES.has(exemptionType)) {
    return NextResponse.json({ error: "Invalid exemptionType" }, { status: 400 });
  }

  const questionnaireJson =
    body.questionnaireJson && typeof body.questionnaireJson === "object" && !Array.isArray(body.questionnaireJson) ?
      body.questionnaireJson
    : {};
  const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : "QC";

  try {
    const profile = await classifyInvestorForPrivatePlacement({
      spvId,
      investorUserId: investorId,
      exemptionType,
      jurisdiction,
      questionnaireJson,
      actorUserId: userId,
      actorRole: user.role,
    });
    return NextResponse.json({
      ok: true,
      profileId: profile.id,
      classifiedExemption: profile.classifiedExemption,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "SPV_NOT_FOUND" || msg === "EXEMPT_DISTRIBUTION_REQUIRED_BEFORE_CLASSIFY" ? 404
      : msg === "BROKER_DEAL_ACCESS_REQUIRED" ? 403
      : msg === "EXEMPTION_NOT_ENABLED_FOR_SPV" ? 403
      : msg === "FORBIDDEN_GUARANTEE_LANGUAGE" ? 400
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
