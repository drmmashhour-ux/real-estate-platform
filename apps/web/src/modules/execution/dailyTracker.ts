import { prisma } from "@/lib/db";
import { utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";

const dayDefaults = {
  messagesSent: 0,
  brokersContacted: 0,
  hostsContacted: 0,
  inquiriesGenerated: 0,
  bookingsCompleted: 0,
  revenue: 0,
};

function calendarDay(d: Date = new Date()) {
  return utcDayStart(d);
}

async function ensureAction(
  type: string,
  opts: { userId?: string | null; status?: string } = {}
) {
  return prisma.executionAction.create({
    data: {
      type,
      userId: opts.userId ?? undefined,
      status: opts.status ?? "done",
    },
  });
}

/** Increment outbound messages for the UTC calendar day; optional CRM user + action row. */
export async function logMessage(
  count = 1,
  asOf: Date = new Date(),
  crm?: { userId?: string | null; status?: string }
) {
  const day = calendarDay(asOf);
  const row = await prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, messagesSent: count },
    update: { messagesSent: { increment: count } },
  });
  await ensureAction("message", { userId: crm?.userId, status: crm?.status });
  return row;
}

/** Broker outreach touch (counts toward daily broker target). */
export async function logBrokerContact(
  count = 1,
  asOf: Date = new Date(),
  crm?: { userId?: string | null; status?: string }
) {
  const day = calendarDay(asOf);
  const row = await prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, brokersContacted: count },
    update: { brokersContacted: { increment: count } },
  });
  await ensureAction("call", { userId: crm?.userId, status: crm?.status ?? "done" });
  return row;
}

/** Completed booking attributed to execution day. */
export async function logBooking(count = 1, asOf: Date = new Date(), crm?: { userId?: string | null }) {
  const day = calendarDay(asOf);
  const row = await prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, bookingsCompleted: count },
    update: { bookingsCompleted: { increment: count } },
  });
  await ensureAction("close", { userId: crm?.userId, status: "done" });
  return row;
}

/** Add revenue (USD) to the execution day rollup. */
export async function logRevenue(amount: number, asOf: Date = new Date()) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("revenue must be a non-negative number");
  const day = calendarDay(asOf);
  return prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, revenue: amount },
    update: { revenue: { increment: amount } },
  });
}

export async function getExecutionDay(asOf: Date = new Date()) {
  return prisma.executionDay.findUnique({ where: { date: calendarDay(asOf) } });
}

export async function getExecutionDaysInRange(start: Date, end: Date) {
  return prisma.executionDay.findMany({
    where: { date: { gte: utcDayStart(start), lte: utcDayStart(end) } },
    orderBy: { date: "asc" },
  });
}

/** Host outreach (rollup only; no separate daily target in v1). */
export async function logHostContact(count = 1, asOf: Date = new Date()) {
  const day = calendarDay(asOf);
  return prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, hostsContacted: count },
    update: { hostsContacted: { increment: count } },
  });
}

export async function logInquiryGenerated(count = 1, asOf: Date = new Date()) {
  const day = calendarDay(asOf);
  return prisma.executionDay.upsert({
    where: { date: day },
    create: { date: day, ...dayDefaults, inquiriesGenerated: count },
    update: { inquiriesGenerated: { increment: count } },
  });
}
