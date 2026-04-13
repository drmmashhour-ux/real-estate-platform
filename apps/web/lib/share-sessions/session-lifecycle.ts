import { ShareAuditActorType, ShareAuditEventType, ShareSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type SessionRow = {
  id: string;
  status: ShareSessionStatus;
  expiresAt: Date;
};

/**
 * If past `expiresAt` and still ACTIVE or PAUSED, mark EXPIRED and write audit (idempotent per row).
 */
export async function expireSessionIfNeeded(row: SessionRow): Promise<ShareSessionStatus> {
  if (row.status !== ShareSessionStatus.ACTIVE && row.status !== ShareSessionStatus.PAUSED) {
    return row.status;
  }
  if (row.expiresAt.getTime() > Date.now()) {
    return row.status;
  }

  await prisma.$transaction([
    prisma.shareSession.update({
      where: { id: row.id },
      data: {
        status: ShareSessionStatus.EXPIRED,
        stoppedAt: new Date(),
        latestLat: null,
        latestLng: null,
        latestAccuracyMeters: null,
        lastLocationAt: null,
      },
    }),
    prisma.shareAuditEvent.create({
      data: {
        shareSessionId: row.id,
        actorType: ShareAuditActorType.SYSTEM,
        eventType: ShareAuditEventType.EXPIRED,
        metadataJson: { reason: "expires_at_passed" },
      },
    }),
  ]);

  return ShareSessionStatus.EXPIRED;
}

export function bookingStayStatusLabel(bookingStatus: string): string {
  const s = bookingStatus.toUpperCase();
  switch (s) {
    case "CONFIRMED":
      return "Confirmed";
    case "COMPLETED":
      return "Completed";
    case "PENDING":
      return "Pending payment";
    case "AWAITING_HOST_APPROVAL":
      return "Awaiting host";
    case "CANCELLED":
      return "Cancelled";
    case "DECLINED":
      return "Declined";
    default:
      return s.replace(/_/g, " ").toLowerCase();
  }
}

export function guestFirstNameFromUser(name: string | null | undefined): string {
  const n = name?.trim();
  if (!n) return "Guest";
  return n.split(/\s+/)[0] ?? "Guest";
}
