import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { RevenueDashboard } from "@/components/internal/RevenueDashboard";
import { LeadScoringTable } from "@/components/internal/LeadScoringTable";
import { GrowthPanel } from "@/components/internal/GrowthPanel";
import { GrowthDashboard } from "@/src/modules/ai-growth-engine/ui/GrowthDashboard";
import { GrowthAutomationDashboard } from "@/src/modules/growth-automation/ui/GrowthAutomationDashboard";
import { GrowthFunnelMetricsPanel } from "@/src/modules/growth-funnel/ui/GrowthFunnelMetricsPanel";
import { ExecutionTrackingSection } from "@/src/modules/growth-funnel/ui/execution/ExecutionTrackingSection";

export const dynamic = "force-dynamic";

export default async function GrowthEnginePage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/growth-engine");

  const u = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });
  if (u?.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <HubLayout title="Growth engine" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="space-y-8 text-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Internal</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Revenue + growth</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            MRR, churn, and LTV from Stripe-mirrored subscriptions. Deterministic lead scores. Growth emails require{" "}
            <code className="text-slate-300">GROWTH_AUTOMATION_ENABLED=1</code>.
          </p>
          <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
        </div>

        <RevenueDashboard />
        <LeadScoringTable />
        <GrowthPanel />

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">AI Growth Engine</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Content automation (drafts)</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Plans, platform adapters, and scheduling are internal-first. Human approval is required before publish; outbound
              social APIs are not enabled in this build.
            </p>
          </div>
          <GrowthDashboard />
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Execution tracking</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Daily metrics & flow</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              New users, simulator volume, activation/retention/conversion, sequential funnel steps, drop-offs vs prior
              window, and auto alerts when rates slip.
            </p>
          </div>
          <ExecutionTrackingSection />
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Growth funnel</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Activation & conversion (raw)</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Funnel events stored in-app + PostHog. Requires migration{" "}
              <code className="text-slate-300">20260330140000_growth_funnel</code>.
            </p>
          </div>
          <GrowthFunnelMetricsPanel />
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Growth automation</p>
            <h2 className="mt-1 text-lg font-semibold text-white">OAuth channels, drafts, publish</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Official API integrations only. OAuth tokens encrypted at rest. Human review is default; approve before
              publish. Set <code className="text-slate-300">GROWTH_TOKEN_ENCRYPTION_KEY</code> (64 hex) or{" "}
              <code className="text-slate-300">GROWTH_TOKEN_ENCRYPTION_SECRET</code> for dev.
            </p>
          </div>
          <GrowthAutomationDashboard />
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-400">Feature flags (server env)</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>REVENUE_ANALYTICS_ENABLED</li>
            <li>LEAD_SCORING_ENABLED</li>
            <li>GROWTH_AUTOMATION_ENABLED</li>
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
