import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryDashboardService } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const playbookId = q.get("playbookId") ?? undefined;
  const domain = q.get("domain") ?? undefined;
  const segmentKey = q.get("segmentKey");
  const marketKey = q.get("marketKey");
  const limit = q.get("limit") != null ? Number.parseInt(String(q.get("limit")), 10) : 100;
  try {
    const rows = await playbookMemoryDashboardService.getBanditStatsView({
      playbookId,
      domain: domain,
      segmentKey: segmentKey ?? undefined,
      marketKey: marketKey ?? undefined,
      limit,
    });
    return NextResponse.json({
      ok: true,
      bandit: rows.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        lastSelectedAt: b.lastSelectedAt?.toISOString() ?? null,
        lastOutcomeAt: b.lastOutcomeAt?.toISOString() ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, bandit: [] });
  }
}
