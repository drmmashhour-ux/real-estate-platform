import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getAvailableVisitSlots } from "@/lib/visits/get-available-slots";
import { rangesOverlap } from "@/lib/visits/overlap";
import { clampDurationMinutes } from "@/lib/visits/validators";
import { VISIT_DURATION_DEFAULT } from "@/lib/visits/constants";

export async function getAvailableSlots(
  brokerId: string,
  dateRange: { from: Date; to: Date },
  durationMinutes?: number,
) {
  return getAvailableVisitSlots({
    brokerUserId: brokerId,
    from: dateRange.from,
    to: dateRange.to,
    durationMinutes: durationMinutes ?? VISIT_DURATION_DEFAULT,
  });
}

export async function isSlotAvailable(
  brokerId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const d = clampDurationMinutes(Math.round((end.getTime() - start.getTime()) / 60000));
  const pad = 60000;
  const from = new Date(start.getTime() - pad);
  const to = new Date(end.getTime() + pad);
  const slots = await getAvailableSlots(brokerId, { from, to }, d);
  return slots.some(
    (s) => new Date(s.start).getTime() === start.getTime() && new Date(s.end).getTime() === end.getTime(),
  );
}

const HOLD_MINUTES = 15;

/**
 * Reserves a slot with a soft hold (`holdExpiresAt`) — no confirmed visit until `confirmVisitBooking`.
 */
export async function reserveSlot(params: {
  leadId: string;
  listingId: string;
  brokerId: string;
  start: Date;
  end: Date;
  visitSource: import("./booking.types").LecipmVisitSourceTag;
  customerUserId?: string | null;
}): Promise<{ ok: true; visitRequestId: string } | { ok: false; error: string }> {
  const available = await isSlotAvailable(params.brokerId, params.start, params.end);
  if (!available) {
    return { ok: false, error: "Slot is no longer available." };
  }

  const until = new Date(Date.now() + HOLD_MINUTES * 60000);
  try {
    const vr = await prisma.$transaction(async (tx) => {
      const otherReq = await tx.lecipmVisitRequest.findFirst({
        where: {
          brokerUserId: params.brokerId,
          status: "pending",
          OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gte: new Date() } }],
          NOT: { leadId: params.leadId },
          AND: [
            { requestedStart: { lt: params.end } },
            { requestedEnd: { gt: params.start } },
          ],
        },
      });
      if (otherReq) {
        throw new Error("OVERLAP");
      }
      const otherVisit = await tx.lecipmVisit.findFirst({
        where: {
          brokerUserId: params.brokerId,
          status: "scheduled",
          AND: [
            { startDateTime: { lt: params.end } },
            { endDateTime: { gt: params.start } },
          ],
        },
      });
      if (otherVisit) {
        throw new Error("OVERLAP");
      }
      return tx.lecipmVisitRequest.create({
        data: {
          leadId: params.leadId,
          listingId: params.listingId,
          brokerUserId: params.brokerId,
          customerUserId: params.customerUserId ?? undefined,
          requestedStart: params.start,
          requestedEnd: params.end,
          status: "pending",
          visitSource: params.visitSource,
          holdExpiresAt: until,
          metadata: { reservedAt: new Date().toISOString() },
        },
      });
    });
    return { ok: true, visitRequestId: vr.id };
  } catch {
    return { ok: false, error: "Another hold or visit overlaps this time." };
  }
}

/** Default range for next N business days. */
export function defaultSearchRange(): { from: Date; to: Date } {
  const from = new Date();
  const to = addDays(from, 14);
  return { from, to };
}
