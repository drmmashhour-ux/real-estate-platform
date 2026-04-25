import { requireAdminSession } from "@/lib/admin/require-admin";
import { getNoShowAnalytics } from "@/modules/no-show-prevention/no-show-analytics.service";
import { getNoShowLearningSnapshot, topRiskSourceMix } from "@/modules/no-show-prevention/no-show-learning.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }
  const [learning, w30, w7, d1, topSources] = await Promise.all([
    getNoShowLearningSnapshot(),
    getNoShowAnalytics({ periodDays: 30 }),
    getNoShowAnalytics({ periodDays: 7 }),
    getNoShowAnalytics({ periodDays: 1 }),
    topRiskSourceMix(),
  ]);
  return Response.json({
    kind: "admin_noshow_prevention_summary_v1",
    learning,
    last30d: w30,
    last7d: w7,
    today: d1,
    topSources,
  });
}
