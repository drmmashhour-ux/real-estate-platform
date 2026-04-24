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
  const limit = q.get("limit") != null ? Number.parseInt(String(q.get("limit")), 10) : 50;
  try {
    const list = await playbookMemoryDashboardService.getRecentAssignments({ playbookId, domain, limit });
    return NextResponse.json({
      ok: true,
      assignments: list.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, assignments: [] });
  }
}
