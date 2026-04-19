import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import {
  buildCityComparison,
  DEFAULT_FAST_DEAL_COMPARISON_CITIES,
} from "@/modules/growth/fast-deal-city-comparison.service";
import { buildCityPlaybookAdaptations } from "@/modules/growth/city-playbook-adaptation.service";

export const dynamic = "force-dynamic";

function parseCitiesParam(raw: string | null): string[] {
  if (!raw?.trim()) return [...DEFAULT_FAST_DEAL_COMPARISON_CITIES];
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 24);
}

/** GET — city playbook adaptation bundle (admin only; internal). */
export async function GET(req: Request) {
  if (!engineFlags.cityPlaybookAdaptationV1 || !engineFlags.fastDealCityComparisonV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const windowDays = Math.min(365, Math.max(7, Number(url.searchParams.get("windowDays")) || 30));
  const cities = parseCitiesParam(url.searchParams.get("cities"));

  const comparison = await buildCityComparison(cities, windowDays);
  const bundle = buildCityPlaybookAdaptations(comparison);

  return NextResponse.json({
    bundle,
    disclaimer:
      "Guided replication intelligence only — suggestions are not executed automatically and do not establish causality.",
  });
}
