import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { hostEconomicsFlags } from "@/config/feature-flags";
import { getPricingPlans } from "@/modules/business";
import { MONTREAL_PRESETS, buildMontrealLaunchScenario } from "@/modules/simulations";
import { LaunchSimulationCard } from "@/components/admin/LaunchSimulationCard";
import { PricingModelAdminCard } from "@/components/admin/PricingModelAdminCard";
import { RoiLeadSnapshotCard } from "@/components/admin/RoiLeadSnapshotCard";
import { HostLeadTable } from "@/components/admin/HostLeadTable";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function HostEconomicsAdminPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const [roiCount, plans, hostLeads] = await Promise.all([
    prisma.roiCalculation.count().catch(() => 0),
    Promise.resolve(getPricingPlans()),
    prisma.hostLead
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          email: true,
          phone: true,
          funnelStatus: true,
          source: true,
          city: true,
          createdAt: true,
        },
      })
      .catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 text-zinc-100 sm:px-6">
      <div>
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 font-serif text-2xl text-amber-100">Host economics & launch scenarios</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Internal planning — not public claims. Flags: ROI {String(hostEconomicsFlags.roiCalculatorV1)} · pricing{" "}
          {String(hostEconomicsFlags.pricingModelV1)} · Montreal {String(hostEconomicsFlags.montrealSimulationV1)} ·
          pricing v2 {String(revenueV4Flags.pricingEngineV2)} · host funnel {String(hostEconomicsFlags.hostOnboardingFunnelV1)}
        </p>
      </div>

      <RoiLeadSnapshotCard count={roiCount} hint="Rows from optional POST /api/roi/calculate persistence. Internal: GET /api/internal/roi/recent." />

      <section>
        <h2 className="font-serif text-lg text-amber-200">Host leads (funnel)</h2>
        <p className="mt-1 text-xs text-zinc-500">From POST /api/hosts/leads/create when funnel flag is on.</p>
        <div className="mt-4">
          <HostLeadTable rows={hostLeads} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg text-amber-200">Pricing model (env-backed)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <PricingModelAdminCard
              key={p.planKey}
              planKey={p.displayName}
              bookingFee={`${(p.bookingFeePercent * 100).toFixed(2)}% booking`}
              note={p.notes[0] ?? ""}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg text-amber-200">Montreal presets (modeled)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MONTREAL_PRESETS.map((h) => {
            const r = buildMontrealLaunchScenario(h);
            return (
              <LaunchSimulationCard
                key={h}
                title={`${h} hosts`}
                hosts={h}
                gainPerHost={`$${(r.hostBenefit.gainPerHostAverageCents / 100).toFixed(2)} CAD`}
                disclaimer={r.disclaimer}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
