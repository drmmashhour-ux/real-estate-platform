import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { loadCommandCenterData } from "@/lib/dashboard/command-center-data";
import { PremiumKpiBar } from "@/components/dashboard/lecipm/PremiumKpiBar";
import { PremiumActionRequired } from "@/components/dashboard/lecipm/PremiumActionRequired";
import { PremiumOpportunities } from "@/components/dashboard/lecipm/PremiumOpportunities";
import { PremiumActivityFeed } from "@/components/dashboard/lecipm/PremiumActivityFeed";
import { PremiumCopilotPanel } from "@/components/dashboard/lecipm/PremiumCopilotPanel";
import { PremiumDealAlertsStrip } from "@/components/dashboard/lecipm/PremiumDealAlertsStrip";
import { isCopilotEnabled } from "@/modules/copilot/config";
import { CopilotFloatingDock } from "@/modules/copilot/ui/CopilotFloatingDock";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/dashboard/command");

  const data = await loadCommandCenterData(userId);

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold">Command center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Decisions at a glance</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Trust and deal signals across your listings — estimates only, not advice.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/fsbo"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-premium-gold/40"
            >
              FSBO hub
            </Link>
            <Link
              href="/dashboard/seller/listings"
              className="rounded-full bg-premium-gold px-5 py-2 text-sm font-bold text-black hover:bg-[#d4b35c]"
            >
              All listings
            </Link>
          </div>
        </header>

        <PremiumKpiBar kpis={data.kpis} />

        <PremiumDealAlertsStrip />

        <div className="grid gap-8 lg:grid-cols-4 lg:items-start">
          <div className="space-y-10 lg:col-span-3">
            <section>
              <h2 className="text-lg font-semibold text-white">Action required</h2>
              <p className="mt-1 text-sm text-slate-500">Listings that need attention first.</p>
              <div className="mt-4">
                <PremiumActionRequired listings={data.listings} />
              </div>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-white">Opportunities</h2>
              <p className="mt-1 text-sm text-slate-500">Stronger deal signals from your latest analyses.</p>
              <div className="mt-4">
                <PremiumOpportunities listings={data.listings} />
              </div>
            </section>
          </div>
          <aside className="space-y-6 lg:col-span-1">
            <PremiumCopilotPanel />
            <div className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-premium-gold/90">Activity</h3>
              <div className="mt-4">
                <PremiumActivityFeed listings={data.listings} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isCopilotEnabled() ? <CopilotFloatingDock /> : null}
    </main>
  );
}
