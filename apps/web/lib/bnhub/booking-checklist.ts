import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const DEFAULT_BNHUB_ARRIVAL_CHECKLIST: { itemKey: string; label: string }[] = [
  { itemKey: "wifi", label: "Wi‑Fi working" },
  { itemKey: "bedding", label: "Beds made / linens clean" },
  { itemKey: "bathroom", label: "Bathroom clean & stocked" },
  { itemKey: "kitchen", label: "Kitchen essentials" },
  { itemKey: "climate", label: "Heating / cooling OK" },
  { itemKey: "access", label: "Keys / access as described" },
  { itemKey: "safety", label: "Smoke / CO detectors present" },
  { itemKey: "parking", label: "Parking as listed" },
];

export async function ensureBnhubBookingChecklist(bookingId: string): Promise<void> {
  const existing = await prisma.bnhubBookingChecklistItem.count({ where: { bookingId } });
  if (existing > 0) return;
  await prisma.bnhubBookingChecklistItem.createMany({
    data: DEFAULT_BNHUB_ARRIVAL_CHECKLIST.map((row) => ({
      bookingId,
      itemKey: row.itemKey,
      label: row.label,
      expected: true,
      confirmed: null,
    })),
    skipDuplicates: true,
  });
}

export async function listBnhubBookingChecklistForGuest(bookingId: string, guestId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, guestId },
    select: {
      id: true,
      status: true,
      checklistDeclaredByHostAt: true,
      payment: { select: { status: true } },
    },
  });
  if (!booking) return null;
  const paid =
    booking.payment?.status === PaymentStatus.COMPLETED &&
    ["CONFIRMED", "COMPLETED"].includes(booking.status);
  if (!paid) return "forbidden" as const;
  await ensureBnhubBookingChecklist(bookingId);
  const items = await prisma.bnhubBookingChecklistItem.findMany({
    where: { bookingId },
    orderBy: { itemKey: "asc" },
  });
  return {
    items,
    hostDeclaredAt: booking.checklistDeclaredByHostAt,
  };
}

export async function listBnhubBookingChecklistForHost(bookingId: string, hostUserId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { ownerId: hostUserId } },
    select: { id: true },
  });
  if (!booking) return null;
  await ensureBnhubBookingChecklist(bookingId);
  return prisma.bnhubBookingChecklistItem.findMany({
    where: { bookingId },
    orderBy: { itemKey: "asc" },
  });
}

export async function declareHostBnhubBookingChecklist(bookingId: string, hostUserId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { ownerId: hostUserId } },
    select: { id: true },
  });
  if (!booking) return { ok: false as const, error: "Not found", status: 404 };
  await ensureBnhubBookingChecklist(bookingId);
  await prisma.booking.update({
    where: { id: bookingId },
    data: { checklistDeclaredByHostAt: new Date() },
  });
  return { ok: true as const };
}

export async function patchGuestBnhubBookingChecklist(
  bookingId: string,
  guestId: string,
  updates: { itemKey: string; confirmed: boolean; note?: string | null }[]
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, guestId },
    select: { id: true, status: true, payment: { select: { status: true } } },
  });
  if (!booking) return { ok: false as const, error: "Not found", status: 404 };
  const paidLike =
    booking.payment?.status === PaymentStatus.COMPLETED &&
    ["CONFIRMED", "COMPLETED"].includes(booking.status);
  if (!paidLike) {
    return { ok: false as const, error: "Checklist opens after payment is confirmed", status: 403 };
  }
  await ensureBnhubBookingChecklist(bookingId);
  for (const u of updates) {
    if (!u.itemKey || typeof u.confirmed !== "boolean") continue;
    const note =
      u.note === undefined ? undefined : u.note === null || u.note === "" ? null : String(u.note).slice(0, 2000);
    await prisma.bnhubBookingChecklistItem.updateMany({
      where: { bookingId, itemKey: u.itemKey },
      data: { confirmed: u.confirmed, ...(note !== undefined ? { note } : {}) },
    });
  }
  return { ok: true as const };
}
