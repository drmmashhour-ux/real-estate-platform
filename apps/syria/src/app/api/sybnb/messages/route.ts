import { z } from "zod";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import type { SyriaUserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { logSybnbEvent } from "@/lib/sybnb/sybnb-audit";
import {
  analyzeMessage,
  analysisNeedsUserConfirmation,
  type ChatMessageAnalysis,
} from "@/lib/sybnb/chat-fraud";
import { normalizeSybnbMessageContent } from "@/lib/sybnb/sybnb-message-content";

export const dynamic = "force-dynamic";

const RISK_WARNING_PROMPT = "This message may contain unsafe content. Continue?";

function bookingParticipantRole(
  userId: string,
  userRole: SyriaUserRole,
  booking: { guestId: string; hostId: string },
): "guest" | "host" | "admin" | null {
  if (userId === booking.guestId) return "guest";
  if (userId === booking.hostId) return "host";
  if (userRole === "ADMIN") return "admin";
  return null;
}

export async function GET(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  const url = new URL(req.url);
  const bookingIdRaw = url.searchParams.get("bookingId") ?? "";
  const idParsed = sybnbIdParam.safeParse(bookingIdRaw.trim());
  if (!idParsed.success) {
    return sybnbFail(firstZodIssueMessage(idParsed.error), 400);
  }
  const bookingId = idParsed.data;

  const booking = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: { id: true, guestId: true, hostId: true },
  });
  if (!booking) {
    return sybnbFail("not_found", 404);
  }

  const part = bookingParticipantRole(user.id, user.role, booking);
  if (!part) {
    return sybnbFail("forbidden", 403);
  }

  const rows = await prisma.sybnbMessage.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
      riskLevel: true,
      riskFlags: true,
    },
  });

  return sybnbJson({ messages: rows });
}

const postBodySchema = z.object({
  bookingId: z.string().trim().min(1),
  content: z.string(),
  confirmRisk: z.boolean().optional(),
});

function auditPayloadFromAnalysis(a: ChatMessageAnalysis): Prisma.InputJsonValue {
  return {
    risk: a.risk,
    flags: a.flags,
  };
}

export async function POST(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return sybnbFail("invalid_json", 400);
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return sybnbFail(firstZodIssueMessage(parsed.error), 400);
  }

  const bookingIdParsed = sybnbIdParam.safeParse(parsed.data.bookingId.trim());
  if (!bookingIdParsed.success) {
    return sybnbFail(firstZodIssueMessage(bookingIdParsed.error), 400);
  }
  const bookingId = bookingIdParsed.data;

  const booking = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: { id: true, guestId: true, hostId: true },
  });
  if (!booking) {
    return sybnbFail("not_found", 404);
  }

  const part = bookingParticipantRole(user.id, user.role, booking);
  if (part !== "guest" && part !== "host") {
    return sybnbFail("forbidden", 403);
  }

  const normalized = normalizeSybnbMessageContent(parsed.data.content);
  if (!normalized.ok) {
    return sybnbFail(normalized.error === "too_long" ? "message_too_long" : "message_empty", 400);
  }

  const analysis = analyzeMessage(normalized.content);

  if (analysisNeedsUserConfirmation(analysis) && parsed.data.confirmRisk !== true) {
    return NextResponse.json({
      success: false,
      warning: true,
      message: RISK_WARNING_PROMPT,
      analysis,
    });
  }

  const row = await prisma.sybnbMessage.create({
    data: {
      bookingId,
      senderId: user.id,
      content: normalized.content,
      riskLevel: analysis.risk,
      riskFlags: analysis.flags as unknown as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
      riskLevel: true,
      riskFlags: true,
    },
  });

  if (analysisNeedsUserConfirmation(analysis)) {
    await logSybnbEvent({
      action: "CHAT_RISK_DETECTED",
      bookingId,
      userId: user.id,
      actorRole: part,
      metadata: auditPayloadFromAnalysis(analysis),
    });
  }

  await logSybnbEvent({
    action: "MESSAGE_SENT",
    bookingId,
    userId: user.id,
    actorRole: part,
    metadata: { length: normalized.content.length },
  });

  return sybnbJson({ message: row });
}
