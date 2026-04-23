import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";

import { getAvailableSlots } from "./broker-availability.service";
import { defaultSearchRange } from "./broker-availability.service";
import { groupSlotsForUi } from "./booking-calendar.service";

export async function resolveSlotConflict(input: {
  brokerId: string;
  attemptedStart: Date;
  durationMinutes: number;
}): Promise<{ replacementSlots: ReturnType<typeof groupSlotsForUi> }> {
  const range = defaultSearchRange();
  const slots = await getAvailableSlots(
    input.brokerId,
    range,
    input.durationMinutes,
  );
  const filtered = slots.filter((s) => new Date(s.start) >= addMinutes(new Date(), 5));
  return { replacementSlots: groupSlotsForUi(filtered) };
}

export async function expireStaleHolds(): Promise<number> {
  const now = new Date();
  const res = await prisma.lecipmVisitRequest.updateMany({
    where: {
      status: "pending",
      holdExpiresAt: { lt: now },
    },
    data: { status: "cancelled" },
  });
  return res.count;
}
