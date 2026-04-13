import { prisma } from "@/lib/db";

export async function getBrokerAvailabilityRows(brokerUserId: string) {
  return prisma.lecipmBrokerAvailability.findMany({
    where: { brokerUserId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getBrokerTimeOffRanges(brokerUserId: string, from: Date, to: Date) {
  return prisma.lecipmBrokerTimeOff.findMany({
    where: {
      brokerUserId,
      OR: [{ startDateTime: { lt: to }, endDateTime: { gt: from } }],
    },
  });
}
