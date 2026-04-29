/**
 * SYBNB booking chat — **Phase 2**
 *
 * - **GET** `?bookingId=` — messages ordered by `createdAt` asc. Session required; **guest**, **host**, or **admin**
 *   (read-only for admins in UI via `canSend={false}`).
 * - **POST** `{ bookingId, content, clientId?, confirmRisk? }` — **guest or host only**; trim + max length {@link SYBNB_MESSAGE_MAX_LEN}.
 *   Optional `clientId` (UUID) dedupes retries/offline flush (`duplicate: true` if already stored).
 *
 * **Phase 3 audit:** each successful send logs **MESSAGE_SENT** (`metadata: { length }`); risky content may log **CHAT_RISK_DETECTED**.
 *
 * Append-only rows in `SybnbMessage`; no external webhooks. Content normalized via {@link normalizeSybnbMessageContent}.
 */
import { z } from "zod";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import type { SyriaUserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import { broadcastSybnbChatActivity } from "@/lib/realtime/sybnb-broadcast";
import { logSybnbEvent } from "@/lib/sybnb/sybnb-audit";
import {
  analyzeMessage,
  analysisNeedsUserConfirmation,
  type ChatMessageAnalysis,
} from "@/lib/sybnb/chat-fraud";
import { normalizeSybnbMessageContent } from "@/lib/sybnb/sybnb-message-content";
import { updateFraudScore } from "@/lib/sybnb/fraud-score";
import { adjustTrustScore } from "@/lib/sybnb/trust-score";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";
import { rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
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

async function handleSybnbMessagesGET(req: Request): Promise<Response> {
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
      clientId: true,
    },
  });

  return sybnbJson({ messages: rows });
}

export async function GET(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handleSybnbMessagesGET(req));
}

const postBodySchema = z.object({
  bookingId: z.string().trim().min(1),
  content: z.string(),
  confirmRisk: z.boolean().optional(),
  /** Preferred dedupe key — matches offline queue row id / `X-Client-Request-Id` */
  clientRequestId: z.string().trim().min(8).max(128).optional(),
  /** Idempotent retries / offline queue flush (legacy alias); prefer `clientRequestId` when both sent */
  clientId: z.string().trim().min(8).max(128).optional(),
});

function auditPayloadFromAnalysis(a: ChatMessageAnalysis): Prisma.InputJsonValue {
  return {
    risk: a.risk,
    flags: a.flags,
  };
}

async function handleSybnbMessagesPOST(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = rateLimit(`sybnb:msg:${ip}`, 30, 60_000);
  if (!limited.allowed) {
    return Response.json({ ok: false, error: "Too many requests" }, { status: 429 });
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

  const clientRequestIdTrimmed = parsed.data.clientRequestId?.trim();
  const clientIdFromBody = parsed.data.clientId?.trim();
  /** Stored on `SybnbMessage.clientId` — per-message idempotency fingerprint */
  const fingerprint = clientRequestIdTrimmed || clientIdFromBody;

  if (fingerprint) {
    const existing = await prisma.sybnbMessage.findFirst({
      where: {
        bookingId,
        senderId: user.id,
        clientId: fingerprint,
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        riskLevel: true,
        riskFlags: true,
        clientId: true,
      },
    });
    if (existing) {
      broadcastSybnbChatActivity(bookingId);
      return sybnbJson({ message: existing, duplicate: true });
    }
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
      ...(fingerprint ? { clientId: fingerprint } : {}),
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
      riskLevel: true,
      riskFlags: true,
      clientId: true,
    },
  });

  if (analysisNeedsUserConfirmation(analysis)) {
    void updateFraudScore(user.id, "chat_risk");
    await logSybnbEvent({
      action: "CHAT_RISK_DETECTED",
      bookingId,
      userId: user.id,
      actorRole: part,
      metadata: auditPayloadFromAnalysis(analysis),
    });
  }

  if (analysis.flags.includes("external_payment")) {
    const repeatRows = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c FROM sybnb_messages
      WHERE sender_id = ${user.id}
        AND id <> ${row.id}
        AND CAST(risk_flags AS TEXT) LIKE '%external_payment%'
    `;
    const prior = Number(repeatRows[0]?.c ?? 0);
    if (prior >= 1) {
      void updateFraudScore(user.id, "external_payment_repeat");
    }
  }

  if (analysis.risk === "low" && analysis.flags.length === 0) {
    const priorClean = await prisma.sybnbMessage.count({
      where: {
        bookingId,
        senderId: user.id,
        id: { not: row.id },
        riskLevel: "low",
      },
    });
    if (priorClean === 0) {
      void adjustTrustScore(user.id, 2);
    }
  }
  if (analysis.risk === "medium" || analysis.risk === "high") {
    const priorRisky = await prisma.sybnbMessage.count({
      where: {
        bookingId,
        senderId: user.id,
        id: { not: row.id },
        riskLevel: { in: ["medium", "high"] },
      },
    });
    if (priorRisky === 0) {
      void adjustTrustScore(user.id, -15);
    }
  }

  await logSybnbEvent({
    action: "MESSAGE_SENT",
    bookingId,
    userId: user.id,
    actorRole: part,
    metadata: { length: normalized.content.length },
  });

  broadcastSybnbChatActivity(bookingId);

  return sybnbJson({ message: row });
}

export async function POST(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handleSybnbMessagesPOST(req));
}
