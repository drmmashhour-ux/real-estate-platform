import { ShareAuditActorType, ShareAuditEventType, ShareSessionStatus, ShareSessionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { bookingStayStatusLabel, expireSessionIfNeeded, guestFirstNameFromUser } from "@/lib/share-sessions/session-lifecycle";
import { hashToken } from "./token";

export type PublicShareInactive = {
  kind: "inactive";
  state: "expired" | "stopped";
  message: string;
};

export type PublicShareActive = {
  kind: "active";
  sessionStatus: ShareSessionStatus;
  shareType: ShareSessionType;
  guestFirstName: string;
  listingName: string;
  listingCity: string;
  stayStatus: string;
  checkIn: string;
  checkOut: string;
  expiresAt: string;
  lastLocation: {
    lat: number;
    lng: number;
    accuracyMeters: number | null;
    updatedAt: string | null;
  } | null;
};

export type GetPublicShareResult =
  | { found: false }
  | { found: true; payload: PublicShareInactive | PublicShareActive };

/**
 * Resolve public share by raw URL token. Call after rate-limit check.
 * Applies expiry transition; logs LINK_OPENED when still active.
 */
export async function getPublicSharePayload(
  rawToken: string,
  opts?: { clientIp?: string }
): Promise<GetPublicShareResult> {
  if (!rawToken || rawToken.length < 20) {
    return { found: false };
  }

  const publicTokenHash = hashToken(decodeURIComponent(rawToken));

  const row = await prisma.shareSession.findUnique({
    where: { publicTokenHash },
    include: {
      booking: {
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
          listing: { select: { title: true, city: true } },
        },
      },
      guest: { select: { name: true } },
    },
  });

  if (!row) return { found: false };

  const status = await expireSessionIfNeeded({
    id: row.id,
    status: row.status,
    expiresAt: row.expiresAt,
  });

  if (status !== ShareSessionStatus.ACTIVE && status !== ShareSessionStatus.PAUSED) {
    return {
      found: true,
      payload: {
        kind: "inactive",
        state: status === ShareSessionStatus.EXPIRED ? "expired" : "stopped",
        message:
          status === ShareSessionStatus.EXPIRED
            ? "This share session has expired."
            : "The guest stopped sharing.",
      },
    };
  }

  await prisma.shareAuditEvent.create({
    data: {
      shareSessionId: row.id,
      actorType: ShareAuditActorType.RECIPIENT,
      eventType: ShareAuditEventType.LINK_OPENED,
      metadataJson: opts?.clientIp ? { ipHash: hashToken(opts.clientIp).slice(0, 16) } : {},
    },
  });

  const guestFirstName = guestFirstNameFromUser(row.guest.name);
  const stayStatus = bookingStayStatusLabel(row.booking.status);

  let lastLocation: PublicShareActive["lastLocation"] = null;
  if (row.shareType === ShareSessionType.LIVE_LOCATION && row.latestLat != null && row.latestLng != null) {
    lastLocation = {
      lat: Number(row.latestLat),
      lng: Number(row.latestLng),
      accuracyMeters: row.latestAccuracyMeters,
      updatedAt: row.lastLocationAt?.toISOString() ?? null,
    };
  }

  return {
    found: true,
    payload: {
      kind: "active",
      sessionStatus: row.status,
      shareType: row.shareType,
      guestFirstName,
      listingName: row.booking.listing.title,
      listingCity: row.booking.listing.city,
      stayStatus,
      checkIn: row.booking.checkIn.toISOString(),
      checkOut: row.booking.checkOut.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      lastLocation,
    },
  };
}
