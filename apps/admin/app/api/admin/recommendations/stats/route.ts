import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getRecommendationAdminStats } from "@/lib/recommendations/admin-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = new URL(request.url).searchParams;
  const days = Math.min(90, Math.max(1, parseInt(sp.get("days") ?? "7", 10) || 7));
  const stats = await getRecommendationAdminStats(days);
  return NextResponse.json(stats);
}
