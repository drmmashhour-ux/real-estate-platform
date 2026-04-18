import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { controlCenterFlags } from "@/config/feature-flags";
import { loadCompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NS = "[control-center:v2]";

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

    if (!controlCenterFlags.companyCommandCenterV2) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sp = request.nextUrl.searchParams;
    const days = parseIntParam(sp.get("days"), 7, 1, 90);
    const limit = parseIntParam(sp.get("limit"), 10, 1, 50);
    const offsetDays = parseIntParam(sp.get("offsetDays"), 0, 0, 365);
    const tab = sp.get("tab") ?? undefined;

    logInfo(NS, {
      event: "request_received",
      days,
      limit,
      offsetDays,
      tab: tab ?? null,
    });

    const payload = await loadCompanyCommandCenterV2Payload({ days, limit, offsetDays, tab });

    return NextResponse.json(payload);
  } catch (e) {
    logInfo(NS, {
      event: "route_error",
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Control center V2 failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
