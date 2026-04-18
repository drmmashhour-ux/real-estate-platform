import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { controlCenterFlags } from "@/config/feature-flags";
import { loadCompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NS = "[control-center:v3]";

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

    if (!controlCenterFlags.companyCommandCenterV3) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sp = request.nextUrl.searchParams;
    const days = parseIntParam(sp.get("days"), 7, 1, 90);
    const limit = parseIntParam(sp.get("limit"), 10, 1, 50);
    const offsetDays = parseIntParam(sp.get("offsetDays"), 0, 0, 365);
    const role = sp.get("role") ?? undefined;

    logInfo(NS, {
      event: "request_received",
      days,
      limit,
      offsetDays,
      role: role ?? null,
    });

    const payload = await loadCompanyCommandCenterV3Payload({ days, limit, offsetDays, role });

    return NextResponse.json(payload);
  } catch (e) {
    logInfo(NS, {
      event: "route_error",
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Control center V3 failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
