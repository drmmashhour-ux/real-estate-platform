import Link from "next/link";
import { redirect } from "next/navigation";

import { getProductInsightHistory } from "@/lib/ai/productInsightLog";
import { getProductActions, getProductInsights } from "@/lib/ai/productIntelligence";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { findInactiveUsers } from "@/lib/retention/engine";
import { trackEvent } from "@/src/services/analytics";

import { ProductIntelligenceAdminTabs } from "./ProductIntelligenceAdminTabs";

export const dynamic = "force-dynamic";

export default async function ProductIntelligenceAdminPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  const [insights, actions, historyRows, inactiveUsers] = await Promise.all([
    getProductInsights(),
    getProductActions(),
    getProductInsightHistory({ limit: 300 }).catch(() => []),
    findInactiveUsers().catch(() => [] as { id: string; email: string }[]),
  ]);
  const inactiveSnapshot = inactiveUsers.slice(0, 200);
  void trackEvent("product_insight_viewed", { insightCount: insights.length }, { userId: admin.userId });
  void trackEvent("operator_daily_flow_view", { order: "SYBNB-AI-122" }, { userId: admin.userId });

  const history = historyRows.map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    priority: r.priority,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 57 · SYBNB-AI-120 · SYBNB-AI-121</p>
        <h1 className="mt-2 text-2xl font-bold">Product intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Retention, feedback, revenue, and event signals → suggestions only. No auto-messaging, no live product rewrites
          from this view.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          <span className="text-zinc-300">Daily habit:</span> use the <strong className="font-semibold text-zinc-200">Daily operator flow</strong> on{" "}
          <strong className="text-zinc-200">Overview</strong> first — then scan insights (2–3 minutes). Use{" "}
          <strong className="text-zinc-200">History</strong> for trends and repeated signals.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
        </div>
      </div>

      <ProductIntelligenceAdminTabs
        locale={locale}
        insights={insights}
        actions={actions}
        history={history}
        inactiveUsers={inactiveSnapshot}
      />
    </div>
  );
}
