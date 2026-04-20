import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { computeUnifiedAnalytics } from "@/modules/analytics/unified-analytics/analytics.service";
import { resolveUnifiedAnalyticsAccess } from "@/modules/analytics/unified-analytics/unified-analytics-access";
import type { UnifiedAnalyticsRangePreset } from "@/modules/analytics/unified-analytics/unified-analytics.types";

export const dynamic = "force-dynamic";

function parsePreset(raw: string | null): UnifiedAnalyticsRangePreset {
  if (raw === "7d" || raw === "90d") return raw;
  return "30d";
}

export async function GET(req: NextRequest) {
  try {
    const viewerId = await getGuestId();
    if (!viewerId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const access = await resolveUnifiedAnalyticsAccess(viewerId);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason ?? "Forbidden" }, { status: 403 });
    }

    const range = parsePreset(req.nextUrl.searchParams.get("range"));
    const user = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = await computeUnifiedAnalytics({
      viewerId,
      role: user.role,
      view: access.view,
      rangePreset: range,
    });

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[dashboard/analytics]", e);
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 500 });
  }
}
