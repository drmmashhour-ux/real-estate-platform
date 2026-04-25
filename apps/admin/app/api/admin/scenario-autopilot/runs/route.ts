import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { listRuns } from "@/modules/scenario-autopilot/scenario-autopilot-run.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const rows = await listRuns(auth.userId, 30);
  return NextResponse.json({
    runs: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
      rejectedAt: r.rejectedAt?.toISOString() ?? null,
    })),
  });
}
