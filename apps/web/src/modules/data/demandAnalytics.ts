import { UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export async function demandByEventType(sinceDays = 30) {
  const since = subDays(new Date(), sinceDays);
  const types = [
    UserEventType.LISTING_VIEW,
    UserEventType.INQUIRY,
    UserEventType.BOOKING_START,
    UserEventType.PAYMENT_SUCCESS,
  ] as const;
  const out: Record<string, number> = {};
  for (const t of types) {
    out[t] = await prisma.userEvent.count({ where: { eventType: t, createdAt: { gte: since } } });
  }
  return { sinceDays, counts: out };
}

export async function leadDemandByCountry(sinceDays = 30) {
  const since = subDays(new Date(), sinceDays);
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true, shortTermListingId: true },
    take: 2000,
  });
  const counts = new Map<string, number>();
  for (const l of leads) {
    if (!l.shortTermListingId) {
      counts.set("unknown", (counts.get("unknown") ?? 0) + 1);
      continue;
    }
    const st = await prisma.shortTermListing.findUnique({
      where: { id: l.shortTermListingId },
      select: { country: true },
    });
    const cc = (st?.country ?? "unknown").toUpperCase();
    counts.set(cc, (counts.get(cc) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}
