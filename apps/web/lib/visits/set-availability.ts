import { prisma } from "@/lib/db";
import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";
import { isValidHHMM } from "@/lib/visits/validators";

export type AvailabilityInputRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  timeZone?: string;
};

export async function replaceBrokerAvailability(brokerUserId: string, rows: AvailabilityInputRow[]) {
  for (const r of rows) {
    if (r.dayOfWeek < 0 || r.dayOfWeek > 6) throw new Error("dayOfWeek must be 0–6 (Sun–Sat)");
    if (!isValidHHMM(r.startTime) || !isValidHHMM(r.endTime)) throw new Error("startTime and endTime must be HH:mm");
    const [sh, sm] = r.startTime.split(":").map((x) => parseInt(x, 10));
    const [eh, em] = r.endTime.split(":").map((x) => parseInt(x, 10));
    if (sh * 60 + sm >= eh * 60 + em) throw new Error("startTime must be before endTime");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lecipmBrokerAvailability.deleteMany({ where: { brokerUserId } });
    if (rows.length === 0) return;
    await tx.lecipmBrokerAvailability.createMany({
      data: rows.map((r) => ({
        brokerUserId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        isActive: r.isActive !== false,
        timeZone: r.timeZone?.trim() || DEFAULT_VISIT_TIME_ZONE,
      })),
    });
  });
}
