import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { classifyAssistance, suggestAssistancePath, buildAssistanceRequestNumber } from "@/lib/compliance/assistance";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { COMPLAINT_PLATFORM_OWNER_ID } from "@/lib/compliance/complaint-case-number";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

const TOPICS = new Set(["listing", "offer", "deposit", "contract", "commission", "general"]);
const LANGS = new Set(["en", "fr", "ar"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ success: false, error: "MESSAGE_REQUIRED" }, { status: 400 });
  }

  const mentionsDeposit = !!body.mentionsDeposit;
  const mentionsFraud = !!body.mentionsFraud;

  let requestType =
    typeof body.requestType === "string" && body.requestType.trim()
      ? body.requestType.trim()
      : classifyAssistance({
          message,
          mentionsDeposit,
          mentionsFraud,
        });

  const aiPath = suggestAssistancePath({ requestType });

  if (aiPath === "file_complaint" && body.userConfirmedEscalation !== true) {
    return NextResponse.json(
      { success: false, error: "USER_CONFIRMATION_REQUIRED", aiSuggestedPath: aiPath },
      { status: 400 }
    );
  }

  const topic =
    typeof body.topic === "string" && TOPICS.has(body.topic) ? body.topic : "general";
  const language = typeof body.language === "string" && LANGS.has(body.language) ? body.language : "en";

  const userId = await getGuestId();

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    actorId: userId ?? "anonymous",
    actorType: userId ? "user" : "anonymous",
  });
  if (blocked) return blocked;

  const request = await prisma.assistanceRequest.create({
    data: {
      requestNumber: buildAssistanceRequestNumber(),
      userId,
      name: typeof body.name === "string" ? body.name : null,
      email: typeof body.email === "string" ? body.email : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      requestType,
      topic,
      relatedListingId: typeof body.relatedListingId === "string" ? body.relatedListingId : null,
      relatedDealId: typeof body.relatedDealId === "string" ? body.relatedDealId : null,
      relatedBrokerId: typeof body.relatedBrokerId === "string" ? body.relatedBrokerId : null,
      message,
      language,
      aiSuggestedPath: aiPath,
      status: "new",
      messages: {
        create: {
          senderType: "user",
          senderId: userId,
          message,
          isOfficial: false,
        },
      },
    },
    include: { messages: true },
  });

  logComplianceEvent("ASSISTANCE_REQUEST_CREATED", {
    assistanceRequestId: request.id,
    requestNumber: request.requestNumber,
    aiSuggestedPath: aiPath,
  });

  await logAuditEvent({
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    entityType: "assistance_request",
    entityId: request.id,
    actionType: "created",
    moduleKey: "assistance",
    actorType: userId ? "user" : "anonymous",
    actorId: userId,
    linkedListingId: request.relatedListingId,
    linkedDealId: request.relatedDealId,
    severity: aiPath === "file_complaint" ? "high" : "info",
    summary: "Public assistance request created",
    details: {
      requestNumber: request.requestNumber,
      requestType,
      topic,
      aiSuggestedPath: aiPath,
    },
  });

  return NextResponse.json({ success: true, request });
}
