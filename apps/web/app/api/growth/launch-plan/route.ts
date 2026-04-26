import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildFirst100UsersPlan, generateDailyLaunchActions } from "@/modules/launch";
import { getRetargetingSnapshot } from "@/modules/experiments/retargeting-audience.service";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

export const dynamic = "force-dynamic";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

/** GET /api/growth/launch-plan — first-100 plan, daily actions, retargeting segments, user counts (admin). */
export async function GET() {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });

  const end = addDays(startOfUtcDay(new Date()), 1);
  const start30 = addDays(end, -30);

  const [plan, daily, retarget, users30d, signupsGrowth] = await Promise.all([
    Promise.resolve(buildFirst100UsersPlan("Montreal")),
    Promise.resolve(generateDailyLaunchActions(new Date(), "Montreal")),
    getRetargetingSnapshot(30),
    prisma.user.count({ where: { createdAt: { gte: start30, lt: end } } }),
    prisma.growthEvent.count({
      where: { eventName: "signup_success", createdAt: { gte: start30, lt: end } },
    }),
  ]);

  return NextResponse.json({
    plan,
    dailyActions: daily,
    retargeting: retarget,
    actuals: {
      range: { start: start30.toISOString(), end: end.toISOString() },
      newUsers30d: users30d,
      signupSuccessGrowthEvents30d: signupsGrowth,
    },
  });
}
