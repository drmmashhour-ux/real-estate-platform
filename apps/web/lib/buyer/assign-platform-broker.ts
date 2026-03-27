import { prisma } from "@/lib/db";

/**
 * Round-robin-ish: pick the verified broker with the fewest `BuyerRequest` assignments.
 * Falls back to any active BROKER role user if none verified.
 */
export async function pickNextPlatformBrokerId(): Promise<string | null> {
  const verified = await prisma.user.findMany({
    where: {
      role: "BROKER",
      accountStatus: "ACTIVE",
      brokerStatus: "VERIFIED",
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const pool = verified.length > 0 ? verified : await prisma.user.findMany({
    where: { role: "BROKER", accountStatus: "ACTIVE" },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 20,
  });
  if (pool.length === 0) return null;

  const counts = await Promise.all(
    pool.map(async (b) => ({
      id: b.id,
      c: await prisma.buyerRequest.count({ where: { assignedBrokerId: b.id } }),
    }))
  );
  counts.sort((a, b) => a.c - b.c || a.id.localeCompare(b.id));
  return counts[0]?.id ?? pool[0]?.id ?? null;
}
