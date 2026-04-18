import { prisma } from "@/lib/db";

const MAX_PER_USER_PER_DAY = 24;

export async function countBrokerMobilePushesToday(userId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `SELECT COUNT(*)::int AS c
     FROM notifications
     WHERE user_id = $1
       AND created_at >= $2
       AND metadata @> $3::jsonb`,
    userId,
    start,
    JSON.stringify({ brokerMobile: true })
  );
  return Number(rows[0]?.c ?? 0);
}

export async function assertPushRateOk(userId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const n = await countBrokerMobilePushesToday(userId);
  if (n >= MAX_PER_USER_PER_DAY) {
    return { ok: false, reason: "Daily broker push cap reached — inbox still updates." };
  }
  return { ok: true };
}
