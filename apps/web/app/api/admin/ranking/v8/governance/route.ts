import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { rankingV8ShadowFlags } from "@/config/feature-flags";
import { loadRankingV8GovernancePayload } from "@/modules/ranking/ranking-v8-governance.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NS = "[ranking:v8:governance]";

function parseIntParam(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

    if (!rankingV8ShadowFlags.rankingV8GovernanceDashboardV1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sp = request.nextUrl.searchParams;
    const days = parseIntParam(sp.get("days"), 7, 1, 90);
    const limit = parseIntParam(sp.get("limit"), 10, 1, 50);
    const offsetDays = parseIntParam(sp.get("offsetDays"), 0, 0, 365);

    const payload = await loadRankingV8GovernancePayload({ days, limit, offsetDays });
    return NextResponse.json(payload);
  } catch (e) {
    logInfo(NS, {
      event: "error",
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Governance payload failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
