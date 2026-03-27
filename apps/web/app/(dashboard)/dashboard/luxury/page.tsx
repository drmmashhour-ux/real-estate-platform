import { getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { LuxuryHero } from "./components/LuxuryHero";
import { LuxuryDashboardClientDynamic } from "./components/LuxuryDashboardClientDynamic";

const GOLD = "#C9A96E";
const BG = "#0f0f0f";

/**
 * Luxury hub – only layout, theme, and static shell. Heavy AI/Canva/projects load in client.
 */
export default async function LuxuryHubPage() {
  const role = await getUserRole();
  const theme = getHubTheme("luxury");

  return (
    <HubLayout
      title="Luxury"
      hubKey="luxury"
      navigation={hubNavigation.luxury}
      showAdminInSwitcher={role === "admin"}
    >
      <div className="space-y-[30px]" style={{ backgroundColor: BG }}>
        <LuxuryHero
          title="Luxury Villa, Palm District"
          subtitle="Palm District • $2.4M"
          accent={GOLD}
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedStatCard label="Views" value={1247} sub="Last 30 days" accent={GOLD} />
          <AnimatedStatCard label="Leads" value={23} sub="Qualified" accent={GOLD} />
          <AnimatedStatCard label="AI Score" value={85} sub="Luxury appeal" accent={GOLD} />
          <AnimatedStatCard label="Luxury Rank" value={12} sub="In segment" accent={GOLD} />
        </section>

        <LuxuryDashboardClientDynamic theme={theme} />

        <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
          <h2 className="text-xl font-semibold" style={{ color: GOLD }}>
            Plan & premium tools
          </h2>
          <p className="mt-3 text-sm text-slate-400">Manage your plan and unlock premium design features.</p>
          <div className="mt-4">
            <ActionButton href="/dashboard/billing" accent={GOLD} variant="secondary">
              Billing & premium unlock
            </ActionButton>
          </div>
        </PremiumCard>
      </div>
    </HubLayout>
  );
}
