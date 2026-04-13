import {
  ShareAuditActorType,
  ShareAuditEventType,
  ShareRecipientType,
  ShareSessionStatus,
  ShareSessionType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeExpiresAt } from "@/lib/share-sessions/duration";
import { encryptRecipientValue } from "@/lib/share-sessions/recipient-crypto";
import { generateSecureToken, hashToken } from "./token";
import { isValidRecipientEmail, parseDurationInput, parseShareTypeInput } from "./validators";

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "";
}

export type CreateShareSessionInput = {
  guestUserId: string;
  body: Record<string, unknown>;
};

export type CreateShareSessionOk = {
  ok: true;
  sessionId: string;
  rawToken: string;
  shareUrl: string;
  expiresAtIso: string;
  warning?: string;
};

export type CreateShareSessionErr = { ok: false; status: number; error: string };

export type CreateShareSessionResult = CreateShareSessionOk | CreateShareSessionErr;

export async function createShareSession(input: CreateShareSessionInput): Promise<CreateShareSessionResult> {
  const { guestUserId, body } = input;

  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (!bookingId) return { ok: false, status: 400, error: "bookingId required" };

  const preset = parseDurationInput(body.duration);
  if (!preset) {
    return {
      ok: false,
      status: 400,
      error: "Invalid duration. Use 1h, 8h, until_checkin, or until_checkout.",
    };
  }

  const shareType = parseShareTypeInput(body.shareType);
  if (!shareType) {
    return { ok: false, status: 400, error: "Invalid shareType. Use live_location or stay_status_only." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, checkIn: true, checkOut: true, status: true },
  });
  if (!booking || booking.guestId !== guestUserId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const recipientRaw = body.recipient as Record<string, unknown> | undefined;
  const recipientTypeStr =
    typeof recipientRaw?.type === "string" ? recipientRaw.type.trim().toLowerCase() : "link_only";
  const recipientType =
    recipientTypeStr === "email" ? ShareRecipientType.EMAIL : ShareRecipientType.LINK_ONLY;
  const displayLabel =
    typeof recipientRaw?.displayLabel === "string" ? recipientRaw.displayLabel.trim().slice(0, 200) : null;
  const emailRaw = typeof recipientRaw?.value === "string" ? recipientRaw.value.trim() : "";
  let encrypted: string | null = null;
  if (recipientType === ShareRecipientType.EMAIL) {
    if (!isValidRecipientEmail(emailRaw)) {
      return { ok: false, status: 400, error: "Valid recipient email required when type is email." };
    }
    encrypted = encryptRecipientValue(emailRaw);
  }

  const expiresAt = computeExpiresAt(preset, booking.checkIn, booking.checkOut);

  const rawToken = generateSecureToken();
  const publicTokenHash = hashToken(rawToken);

  const previous = await prisma.shareSession.findMany({
    where: {
      bookingId,
      guestUserId,
      status: { in: [ShareSessionStatus.ACTIVE, ShareSessionStatus.PAUSED] },
    },
    select: { id: true },
  });

  const created = await prisma.$transaction(async (tx) => {
    for (const p of previous) {
      await tx.shareSession.update({
        where: { id: p.id },
        data: {
          status: ShareSessionStatus.STOPPED,
          stoppedAt: new Date(),
          latestLat: null,
          latestLng: null,
          latestAccuracyMeters: null,
          lastLocationAt: null,
        },
      });
      await tx.shareAuditEvent.create({
        data: {
          shareSessionId: p.id,
          actorType: ShareAuditActorType.GUEST,
          eventType: ShareAuditEventType.STOPPED,
          metadataJson: { reason: "replaced_by_new_session" },
        },
      });
    }

    const session = await tx.shareSession.create({
      data: {
        bookingId,
        guestUserId,
        publicTokenHash,
        status: ShareSessionStatus.ACTIVE,
        shareType,
        expiresAt,
      },
    });

    await tx.shareRecipient.create({
      data: {
        shareSessionId: session.id,
        recipientType,
        recipientValueEncrypted: encrypted,
        displayLabel:
          displayLabel ??
          (recipientType === ShareRecipientType.EMAIL ? emailRaw.split("@")[0] : "Trusted contact"),
      },
    });

    await tx.shareAuditEvent.create({
      data: {
        shareSessionId: session.id,
        actorType: ShareAuditActorType.GUEST,
        eventType: ShareAuditEventType.CREATED,
        metadataJson: {
          duration: preset,
          shareType,
          recipientType,
        },
      },
    });

    return session;
  });

  const base = appOrigin();
  const path = `/share/${encodeURIComponent(rawToken)}`;
  const shareUrl = base ? `${base}${path}` : path;

  return {
    ok: true,
    sessionId: created.id,
    rawToken,
    shareUrl,
    expiresAtIso: created.expiresAt.toISOString(),
    warning:
      encrypted == null && recipientType === ShareRecipientType.EMAIL
        ? "Recipient email was not stored encrypted (set SHARE_SESSIONS_ENCRYPTION_KEY). Use the link to share manually."
        : undefined,
  };
}
