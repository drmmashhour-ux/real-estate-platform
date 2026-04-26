import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getCampaignGrowthStats } from "@/modules/campaigns/campaign.service";

export const dynamic = "force-dynamic";

/** GET /api/campaigns/[id]/stats — `growth_events` rollups by `utm_campaign` (admin). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });
  const { id } = await ctx.params;
  const raw = req.nextUrl.searchParams.get("days");
  const n = raw ? Number.parseInt(raw, 10) : 30;
  const days = Number.isFinite(n) ? Math.min(180, Math.max(1, n)) : 30;

  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stats = await getCampaignGrowthStats(campaign, days);
  return NextResponse.json({ campaign, stats });
}
