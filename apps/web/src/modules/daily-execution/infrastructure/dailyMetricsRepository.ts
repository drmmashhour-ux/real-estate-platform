import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { parseVariantStats } from "../domain/variantStats";

export type MetricCounter = "messagesSent" | "repliesReceived" | "callsBooked" | "usersOnboarded";

export async function bumpDailyMetric(
  db: PrismaClient,
  userId: string,
  metricDate: Date,
  field: MetricCounter,
  delta: number
): Promise<void> {
  const safe = Math.max(0, Math.floor(delta));
  if (safe === 0) return;

  const createBase: Prisma.DailyMetricCreateInput = {
    id: randomUUID(),
    user: { connect: { id: userId } },
    metricDate,
    messagesSent: field === "messagesSent" ? safe : 0,
    repliesReceived: field === "repliesReceived" ? safe : 0,
    callsBooked: field === "callsBooked" ? safe : 0,
    usersOnboarded: field === "usersOnboarded" ? safe : 0,
  };

  const update: Prisma.DailyMetricUpdateInput = {};
  if (field === "messagesSent") update.messagesSent = { increment: safe };
  if (field === "repliesReceived") update.repliesReceived = { increment: safe };
  if (field === "callsBooked") update.callsBooked = { increment: safe };
  if (field === "usersOnboarded") update.usersOnboarded = { increment: safe };

  await db.dailyMetric.upsert({
    where: { userId_metricDate: { userId, metricDate } },
    create: createBase,
    update,
  });
}

export async function recordVariantEvent(
  db: PrismaClient,
  userId: string,
  metricDate: Date,
  variantKey: string,
  event: "use" | "reply"
): Promise<void> {
  const key = variantKey.trim();
  if (!key) return;

  await db.$transaction(async (tx) => {
    const row = await tx.dailyMetric.findUnique({
      where: { userId_metricDate: { userId, metricDate } },
    });
    const stats = parseVariantStats(row?.variantStats);
    const cur = stats[key] ?? { uses: 0, replies: 0 };
    if (event === "use") cur.uses += 1;
    else cur.replies += 1;
    stats[key] = cur;

    if (!row) {
      await tx.dailyMetric.create({
        data: {
          id: randomUUID(),
          user: { connect: { id: userId } },
          metricDate,
          variantStats: stats as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.dailyMetric.update({
        where: { id: row.id },
        data: { variantStats: stats as Prisma.InputJsonValue },
      });
    }
  });
}

export async function getDailyMetricForDay(db: PrismaClient, userId: string, metricDate: Date) {
  return db.dailyMetric.findUnique({
    where: { userId_metricDate: { userId, metricDate } },
  });
}
