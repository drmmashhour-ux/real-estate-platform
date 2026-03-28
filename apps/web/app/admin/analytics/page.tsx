import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getProductInsightsPayload } from "@/modules/analytics/services/product-insights-queries";
import { prisma } from "@/lib/db";
import { AdminAnalyticsShell } from "./admin-analytics-shell";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/analytics");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/admin");
  }

  const productInsights = await getProductInsightsPayload().catch(() => ({
    days: 30,
    approxUsers: 0,
    counts: {
      ANALYZE: 0,
      SAVE_DEAL: 0,
      COMPARE: 0,
      VISIT_PAGE: 0,
      WAITLIST_SIGNUP: 0,
      RETURN_VISIT: 0,
    },
    growth: {
      emailsCollectedTotal: 0,
      emailsCollectedPeriod: 0,
      analyzeToSavePercent: null as number | null,
      repeatVisitSessions: 0,
      returnVisitEvents: 0,
      waitlistEvents: 0,
    },
    mostUsedFeature: null as string | null,
    feedback: [] as { id: string; message: string; rating: number | null; createdAt: string }[],
    wordHighlights: [] as { word: string; count: number }[],
    insights: [] as string[],
  }));

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="text-sm font-medium text-premium-gold transition hover:text-premium-gold"
        >
          ← Admin
        </Link>
        <header className="mt-6 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
            Admin analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Analytics dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            <span className="font-medium text-white/90">Marketing &amp; ads:</span> URL params{" "}
            <code className="text-premium-gold">?source=</code>, <code className="text-premium-gold">?campaign=</code>,{" "}
            <code className="text-premium-gold">?medium=</code> (or UTM) set first-touch attribution.{" "}
            <span className="font-medium text-white/90">Platform metrics:</span> visitors, listings mix, and closed
            BNHub transactions.
          </p>
        </header>

        <AdminAnalyticsShell productInsights={productInsights} />
      </div>
    </main>
  );
}
