import { prisma } from "@/lib/db";

export function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export type DailyBumpField = "contacts" | "leads" | "callsBooked" | "clientsClosed";

function buildCreateCounts(field: DailyBumpField, delta: number) {
  return {
    contactsCount: field === "contacts" ? delta : 0,
    leadsCount: field === "leads" ? delta : 0,
    callsBookedCount: field === "callsBooked" ? delta : 0,
    clientsClosedCount: field === "clientsClosed" ? delta : 0,
  };
}

function buildIncrement(field: DailyBumpField, delta: number) {
  switch (field) {
    case "contacts":
      return { contactsCount: { increment: delta } };
    case "leads":
      return { leadsCount: { increment: delta } };
    case "callsBooked":
      return { callsBookedCount: { increment: delta } };
    case "clientsClosed":
      return { clientsClosedCount: { increment: delta } };
    default: {
      const _x: never = field;
      return _x;
    }
  }
}

/** Ensure row exists for owner + UTC day, then increment one counter. */
export async function incrementDailyProgress(
  ownerId: string,
  day: Date,
  field: DailyBumpField,
  delta = 1
): Promise<void> {
  const date = startOfUtcDay(day);
  await prisma.clientAcquisitionDailyProgress.upsert({
    where: { ownerId_date: { ownerId, date } },
    create: {
      ownerId,
      date,
      ...buildCreateCounts(field, delta),
    },
    update: buildIncrement(field, delta),
  });
}

export async function getOrCreateTodayProgress(ownerId: string): Promise<{
  contactsCount: number;
  leadsCount: number;
  callsBookedCount: number;
  clientsClosedCount: number;
  date: Date;
}> {
  const date = startOfUtcDay();
  let row = await prisma.clientAcquisitionDailyProgress.findUnique({
    where: { ownerId_date: { ownerId, date } },
  });
  if (!row) {
    row = await prisma.clientAcquisitionDailyProgress.create({
      data: { ownerId, date },
    });
  }
  return {
    contactsCount: row.contactsCount,
    leadsCount: row.leadsCount,
    callsBookedCount: row.callsBookedCount,
    clientsClosedCount: row.clientsClosedCount,
    date: row.date,
  };
}
