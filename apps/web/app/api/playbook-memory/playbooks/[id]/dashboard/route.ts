import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryDashboardService } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" });
  }
  try {
    const d = await playbookMemoryDashboardService.getPlaybookDetail(id);
    if (d == null) {
      return NextResponse.json({ ok: true, detail: null });
    }
    const { playbook, lifecycle, assignments, bandit, memorySummaries } = d;
    return NextResponse.json({
      ok: true,
      detail: {
        playbook: { ...playbook, updatedAt: playbook.updatedAt.toISOString() },
        lifecycle: lifecycle.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
        assignments: assignments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
        bandit: bandit.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
          lastSelectedAt: b.lastSelectedAt?.toISOString() ?? null,
          lastOutcomeAt: b.lastOutcomeAt?.toISOString() ?? null,
        })),
        memorySummaries: memorySummaries.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      },
    });
  } catch {
    return NextResponse.json({ ok: true, detail: null });
  }
}
