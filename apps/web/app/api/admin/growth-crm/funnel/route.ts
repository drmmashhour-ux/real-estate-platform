import { NextResponse } from "next/server";
import { EarlyUserTrackingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;

  const [byStatus, bySource] = await Promise.all([
    prisma.earlyUserTracking.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.earlyUserTracking.groupBy({
      by: ["source"],
      _count: { id: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of Object.values(EarlyUserTrackingStatus)) {
    statusCounts[s] = 0;
  }
  for (const row of byStatus) {
    statusCounts[row.status] = row._count.id;
  }

  const sourceCounts: Record<string, number> = {};
  for (const row of bySource) {
    const key = row.source ?? "(none)";
    sourceCounts[key] = row._count.id;
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    total,
    byStatus: statusCounts,
    bySource: sourceCounts,
    stageLabels: {
      CONTACTED: "contacted",
      REPLIED: "replied",
      SIGNED_UP: "signed",
      ONBOARDED: "active",
    },
  });
}
