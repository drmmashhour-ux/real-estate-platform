import { prisma } from "@/lib/db";

export type CapTableRow = {
  holderId: string;
  name: string;
  role: string;
  totalShares: number;
  vestedShares: number;
  unvestedShares: number;
  equityPercent: number;
};

/**
 * Fully diluted = sum of all grant `totalShares`. Each holder % = their grant totals / FD.
 */
export async function getCapTableSnapshot(): Promise<{
  rows: CapTableRow[];
  totalFullyDiluted: number;
  totalVested: number;
  totalUnvested: number;
}> {
  const holders = await prisma.equityHolder.findMany({
    include: {
      grants: { select: { totalShares: true, vestedShares: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const stats = holders.map((h) => {
    let totalShares = 0;
    let vestedShares = 0;
    for (const g of h.grants) {
      totalShares += g.totalShares;
      vestedShares += g.vestedShares;
    }
    return { h, totalShares, vestedShares };
  });

  const totalFullyDiluted = stats.reduce((s, x) => s + x.totalShares, 0);
  const totalVested = stats.reduce((s, x) => s + x.vestedShares, 0);

  const rows: CapTableRow[] = stats.map(({ h, totalShares, vestedShares }) => ({
    holderId: h.id,
    name: h.name,
    role: h.role,
    totalShares,
    vestedShares,
    unvestedShares: Math.max(0, totalShares - vestedShares),
    equityPercent: totalFullyDiluted > 0 ? (totalShares / totalFullyDiluted) * 100 : 0,
  }));

  return {
    rows,
    totalFullyDiluted,
    totalVested,
    totalUnvested: Math.max(0, totalFullyDiluted - totalVested),
  };
}

/** Persist `equityPercent` on each holder from current grants (investor-ready single source). */
export async function syncHolderEquityPercents() {
  const snap = await getCapTableSnapshot();
  await Promise.all(
    snap.rows.map((r) =>
      prisma.equityHolder.update({
        where: { id: r.holderId },
        data: { equityPercent: r.equityPercent },
      })
    )
  );
  return snap;
}
