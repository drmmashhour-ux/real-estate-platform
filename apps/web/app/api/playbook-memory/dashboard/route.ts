import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryDashboardService } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safe() {
  return { ok: true as const, overview: null, experiment: null, playbooks: [] as const };
}

export async function GET(_req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(_req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [overview, experiment, playbooks] = await Promise.all([
      playbookMemoryDashboardService.getOverview(),
      playbookMemoryDashboardService.getExperimentHealth(),
      playbookMemoryDashboardService.getPlaybookSummaries(200),
    ]);
    return NextResponse.json({
      ok: true,
      overview,
      experiment,
      playbooks: playbooks.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() })),
    });
  } catch {
    return NextResponse.json(safe());
  }
}
