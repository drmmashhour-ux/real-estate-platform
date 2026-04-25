import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { controlCenterFlags } from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NS = "[control-center]";

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

    if (!controlCenterFlags.aiControlCenterV1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sp = request.nextUrl.searchParams;
    const days = parseIntParam(sp.get("days"), 7, 1, 90);
    const limit = parseIntParam(sp.get("limit"), 10, 1, 50);
    const offsetDays = parseIntParam(sp.get("offsetDays"), 0, 0, 365);

    logInfo(NS, {
      event: "request_received",
      days,
      limit,
      offsetDays,
    });

    const payload = await loadAiControlCenterPayload({ days, limit, offsetDays });
    return NextResponse.json(payload);
  } catch (e) {
    logInfo(NS, {
      event: "route_error",
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Control center failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
