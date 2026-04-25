import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";

import { createDealFromTurboDraft } from "@/modules/turbo-form-drafting/deal-pipeline.service";
import { validateBeforeSignature } from "@/modules/production-guard/validationEngine";
import { logProductionAuditEvent } from "@/modules/production-guard/auditTrail";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const productionMode = process.env.PRODUCTION_MODE === "true";

  try {
    const { draftId } = await req.json();

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    // @ts-ignore
    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // @ts-ignore
    const acks = await prisma.turboDraftAcknowledgement.findMany({
      where: { draftId },
    });

    // @ts-ignore
    const latestScore = await prisma.trustHubScore.findFirst({
      where: { draftId },
      orderBy: { createdAt: "desc" }
    });

    const resultJson = draft.resultJson as any;
    const notices = resultJson?.notices || [];
    const risks = resultJson?.risks || [];

    // Map acks to resultJson
    const mappedResult = {
      ...resultJson,
      notices: notices.map((n: any) => ({
        ...n,
        acknowledged: acks.some((a: any) => a.noticeKey === n.noticeKey)
      }))
    };

    const isBroker = (draft.contextJson as any)?.role === "BROKER";
    const isPaid = draft.status === "PAID" || isBroker || draft.status === "DEAL_CREATED";
    
    let canSign = false;
    let errors: string[] = [];

    if (productionMode) {
      const guardResult = validateBeforeSignature(
        draft,
        mappedResult,
        latestScore?.score || 0,
        isPaid
      );
      canSign = guardResult.canSign;
      errors = guardResult.errors;
    } else {
      const missingAcks = notices
        .filter((n: any) => n.severity === "CRITICAL")
        .filter((n: any) => !acks.some((a: any) => a.noticeKey === n.noticeKey));
      canSign = draft.canProceed && missingAcks.length === 0 && isPaid;
      if (!canSign) {
        if (!draft.canProceed) errors.push("Draft validation issues");
        if (missingAcks.length > 0) errors.push("Missing acknowledgments");
        if (!isPaid) errors.push("Payment required");
      }
    }

    // Trigger deal pipeline if ready
    if (canSign && draft.status === "DRAFT") {
      await createDealFromTurboDraft(draftId).catch(console.error);
      await logProductionAuditEvent(draftId, auth.user.id, "PG_SIGNATURE_GATE_PASS", { score: latestScore?.score || 0, ip }, ip);
    } else if (!canSign && errors.length > 0) {
      await logProductionAuditEvent(draftId, auth.user.id, "PG_SIGNATURE_GATE_FAIL", { errors, ip }, ip, "WARNING");
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    return NextResponse.json({
      status: draft.status,
      canSign,
      isPaid,
      errors,
      score: latestScore?.score || 0,
      totalAcks: acks.length,
      risks,
      ip,
    });
  } catch (err) {
    console.error("[api:turbo-draft:status] error", err);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
