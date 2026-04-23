import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { buildAcknowledgment } from "@/lib/compliance/acknowledgment";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

/**
 * POST — append an official message; **must** use an active `AcknowledgmentTemplate` (compliance: reproducible wording).
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const assistanceRequestId = typeof body.assistanceRequestId === "string" ? body.assistanceRequestId.trim() : "";
  const templateKey = typeof body.templateKey === "string" ? body.templateKey.trim() : "";
  const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "en";

  if (!assistanceRequestId || !templateKey) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const ar = await prisma.assistanceRequest.findUnique({ where: { id: assistanceRequestId } });
  if (!ar) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }
  if (ar.threadLocked) {
    return NextResponse.json({ success: false, error: "ASSISTANCE_THREAD_LOCKED" }, { status: 400 });
  }

  const template = await prisma.acknowledgmentTemplate.findFirst({
    where: { templateKey, language, isActive: true },
  });
  if (!template) {
    return NextResponse.json({ success: false, error: "OFFICIAL_MESSAGE_TEMPLATE_REQUIRED" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : ar.name;
  const caseNumber =
    typeof body.caseNumber === "string" ? body.caseNumber : ar.linkedComplaintCaseId ?? ar.requestNumber;
  const built = buildAcknowledgment(template, { name, caseNumber });

  const msg = await prisma.assistanceMessage.create({
    data: {
      assistanceRequestId,
      senderType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
      senderId: userId,
      message: built.body,
      isOfficial: true,
    },
  });

  await prisma.assistanceRequest.update({
    where: { id: assistanceRequestId },
    data: { status: ar.status === "new" ? "responded" : ar.status },
  });

  logComplianceEvent("ASSISTANCE_OFFICIAL_MESSAGE", {
    assistanceRequestId,
    templateKey,
    language,
    performedById: userId,
  });

  return NextResponse.json({ success: true, message: msg, subject: built.subject });
}
