/**
 * BNHub OTA / channel manager integration — push availability, ingest webhooks.
 * Concrete channel APIs are stubbed; wiring is ready for Booking.com / Airbnb / Expedia.
 */

import {
  BnhubChannelPlatform,
  BnhubChannelSyncStatus,
  BnhubDayAvailabilityStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { eachNightBetween, utcDayStart } from "./availability-day-helpers";

export type ChannelPlatformKey =
  | "booking"
  | "airbnb"
  | "expedia"
  | "vrbo"
  | "trivago"
  | "hotels_com"
  | "google_hotel"
  | "other";

export function toPrismaPlatform(key: ChannelPlatformKey): BnhubChannelPlatform {
  switch (key) {
    case "booking":
      return BnhubChannelPlatform.BOOKING_COM;
    case "airbnb":
      return BnhubChannelPlatform.AIRBNB;
    case "expedia":
      return BnhubChannelPlatform.EXPEDIA;
    case "vrbo":
      return BnhubChannelPlatform.VRBO;
    case "trivago":
      return BnhubChannelPlatform.TRIVAGO;
    case "hotels_com":
      return BnhubChannelPlatform.HOTELS_COM;
    case "google_hotel":
      return BnhubChannelPlatform.GOOGLE_HOTEL;
    default:
      return BnhubChannelPlatform.OTHER;
  }
}

export async function logChannelSync(params: {
  mappingId?: string | null;
  listingId?: string | null;
  platform?: string | null;
  direction: "push" | "pull" | "webhook_in";
  status: "success" | "error";
  message?: string;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.bnhubChannelSyncLog
    .create({
      data: {
        mappingId: params.mappingId ?? undefined,
        listingId: params.listingId ?? undefined,
        platform: params.platform ?? undefined,
        direction: params.direction,
        status: params.status,
        message: params.message,
        payload: params.payload,
      },
    })
    .catch(() => {});
}

/**
 * Push availability for a listing to all mapped external properties (stub: logs success).
 */
export async function pushAvailabilityToChannels(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, externalSyncEnabled: true },
  });
  if (!listing?.externalSyncEnabled) {
    await logChannelSync({
      listingId,
      direction: "push",
      status: "error",
      message: "External sync disabled for listing",
    });
    return;
  }

  const mappings = await prisma.bnhubExternalListingMapping.findMany({ where: { listingId } });
  if (mappings.length === 0) {
    await logChannelSync({
      listingId,
      direction: "push",
      status: "error",
      message: "No external mapping configured",
    });
    return;
  }

  const now = new Date();
  for (const m of mappings) {
    await prisma.bnhubExternalListingMapping.update({
      where: { id: m.id },
      data: { lastSyncAt: now, syncStatus: BnhubChannelSyncStatus.OK, lastError: null },
    });
    await logChannelSync({
      mappingId: m.id,
      listingId,
      platform: m.platform,
      direction: "push",
      status: "success",
      message: "Availability push queued (stub — connect channel API)",
      payload: { listingId, externalId: m.externalId, platform: m.platform } as unknown as Prisma.InputJsonValue,
    });
  }
}

export type WebhookIngestResult =
  | { ok: true }
  | { ok: false; reason: string; status: number };

/**
 * Handle inbound reservation / cancellation from external channel (e.g. channel manager webhook).
 * Blocks calendar nights without creating a BNHub Booking row (external-only booking).
 */
export async function ingestExternalReservationWebhook(
  payload: Record<string, unknown>
): Promise<WebhookIngestResult> {
  const platformRaw = String(payload.platform ?? payload.channel ?? "").toLowerCase();
  const externalListingId = String(payload.externalListingId ?? payload.listing_id ?? "");
  const externalReservationId = String(payload.reservation_id ?? payload.id ?? "");
  const checkInStr = String(payload.check_in ?? payload.checkIn ?? "");
  const checkOutStr = String(payload.check_out ?? payload.checkOut ?? "");
  const cancelled = payload.cancelled === true || payload.status === "cancelled";

  if (!externalListingId || !checkInStr || !checkOutStr) {
    await logChannelSync({
      direction: "webhook_in",
      status: "error",
      message: "Missing externalListingId or dates",
      payload: payload as Prisma.InputJsonValue,
    });
    return { ok: false, reason: "invalid_payload", status: 400 };
  }

  const platformKey: ChannelPlatformKey = platformRaw.includes("airbnb")
    ? "airbnb"
    : platformRaw.includes("expedia")
      ? "expedia"
      : platformRaw.includes("vrbo") || platformRaw.includes("homeaway")
        ? "vrbo"
        : platformRaw.includes("trivago")
          ? "trivago"
          : platformRaw.includes("hotels.com") || platformRaw.includes("hotels_com")
            ? "hotels_com"
            : platformRaw.includes("google")
              ? "google_hotel"
              : platformRaw.includes("booking")
                ? "booking"
                : "other";
  const prismaPlatform = toPrismaPlatform(platformKey);

  const mapping = await prisma.bnhubExternalListingMapping.findFirst({
    where: { platform: prismaPlatform, externalId: externalListingId },
    include: { listing: { select: { id: true, externalSyncEnabled: true } } },
  });

  if (!mapping) {
    await logChannelSync({
      platform: prismaPlatform,
      direction: "webhook_in",
      status: "error",
      message: "Unknown external listing",
      payload: payload as Prisma.InputJsonValue,
    });
    return { ok: false, reason: "unknown_listing", status: 404 };
  }

  if (!mapping.listing.externalSyncEnabled) {
    await prisma.bnhubExternalListingMapping.update({
      where: { id: mapping.id },
      data: {
        syncStatus: BnhubChannelSyncStatus.ERROR,
        lastError: "External sync disabled for listing",
      },
    });
    await logChannelSync({
      mappingId: mapping.id,
      listingId: mapping.listingId,
      direction: "webhook_in",
      status: "error",
      message: "External sync disabled",
    });
    return { ok: false, reason: "sync_disabled", status: 403 };
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    await prisma.bnhubExternalListingMapping.update({
      where: { id: mapping.id },
      data: {
        syncStatus: BnhubChannelSyncStatus.ERROR,
        lastError: "Invalid check-in or check-out in webhook payload",
      },
    });
    await logChannelSync({
      mappingId: mapping.id,
      listingId: mapping.listingId,
      platform: prismaPlatform,
      direction: "webhook_in",
      status: "error",
      message: "Invalid dates",
      payload: payload as Prisma.InputJsonValue,
    });
    return { ok: false, reason: "invalid_dates", status: 400 };
  }

  const nights = eachNightBetween(checkIn, checkOut);

  await prisma.$transaction(async (tx) => {
    if (cancelled) {
      for (const date of nights) {
        await tx.availabilitySlot.updateMany({
          where: {
            listingId: mapping.listingId,
            date: utcDayStart(date),
            dayStatus: BnhubDayAvailabilityStatus.BOOKED,
            bookedByBookingId: null,
          },
          data: {
            available: true,
            dayStatus: BnhubDayAvailabilityStatus.AVAILABLE,
          },
        });
      }
    } else {
      for (const date of nights) {
        const d = utcDayStart(date);
        const existing = await tx.availabilitySlot.findUnique({
          where: { listingId_date: { listingId: mapping.listingId, date: d } },
        });
        if (existing?.dayStatus === BnhubDayAvailabilityStatus.BLOCKED) {
          continue;
        }
        await tx.availabilitySlot.upsert({
          where: { listingId_date: { listingId: mapping.listingId, date: d } },
          create: {
            listingId: mapping.listingId,
            date: d,
            available: false,
            dayStatus: BnhubDayAvailabilityStatus.BOOKED,
            bookedByBookingId: null,
          },
          update: {
            available: false,
            dayStatus: BnhubDayAvailabilityStatus.BOOKED,
            bookedByBookingId: null,
          },
        });
      }
    }
  });

  await prisma.bnhubExternalListingMapping.update({
    where: { id: mapping.id },
    data: {
      lastSyncAt: new Date(),
      syncStatus: BnhubChannelSyncStatus.OK,
      lastError: null,
    },
  });

  await logChannelSync({
    mappingId: mapping.id,
    listingId: mapping.listingId,
    platform: prismaPlatform,
    direction: "webhook_in",
    status: "success",
    message: cancelled ? "External reservation cancelled" : `External hold ${externalReservationId || "n/a"}`,
    payload: payload as Prisma.InputJsonValue,
  });

  return { ok: true };
}
