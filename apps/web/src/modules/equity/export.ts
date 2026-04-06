import type { Prisma } from "@prisma/client";
import { getCapTableSnapshot } from "./capTable";
import { prisma } from "@/lib/db";

export type EquityGrantExportRow = Prisma.EquityGrantGetPayload<{
  include: { holder: { select: { name: true; role: true } } };
}>;

export type EquityExportPayload = {
  generatedAt: string;
  summary: {
    totalFullyDiluted: number;
    totalVested: number;
    totalUnvested: number;
  };
  holders: Awaited<ReturnType<typeof getCapTableSnapshot>>["rows"];
  grants: EquityGrantExportRow[];
};

export async function buildEquityExportPayload(): Promise<EquityExportPayload> {
  const snap = await getCapTableSnapshot();
  const grants = await prisma.equityGrant.findMany({
    orderBy: { createdAt: "asc" },
    include: { holder: { select: { name: true, role: true } } },
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFullyDiluted: snap.totalFullyDiluted,
      totalVested: snap.totalVested,
      totalUnvested: snap.totalUnvested,
    },
    holders: snap.rows,
    grants,
  };
}

export function equityPayloadToJson(payload: EquityExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function equityPayloadToCsv(payload: EquityExportPayload): string {
  const lines = [
    "section,holder_id,name,role,total_shares,vested_shares,unvested_shares,equity_percent_fd",
    ...payload.holders.map((h) =>
      [
        "holder",
        h.holderId,
        csvEscape(h.name),
        h.role,
        h.totalShares,
        h.vestedShares,
        h.unvestedShares,
        h.equityPercent.toFixed(4),
      ].join(",")
    ),
    "section,grant_id,holder_name,total_shares,vested,vesting_start,vesting_months,cliff_months",
    ...payload.grants.map((g) =>
      [
        "grant",
        g.id,
        csvEscape(g.holder.name),
        g.totalShares,
        g.vestedShares,
        g.vestingStart.toISOString().slice(0, 10),
        g.vestingDuration,
        g.cliffMonths,
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
