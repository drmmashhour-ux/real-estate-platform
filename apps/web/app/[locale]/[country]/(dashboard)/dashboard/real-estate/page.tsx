import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { hubNavigation } from "@/lib/hub/navigation";
import { PLATFORM_IMMOBILIER_HUB_NAME } from "@/lib/brand/platform";
import { getHubTheme } from "@/lib/hub/themes";
import { getAiFallbacksForHub } from "@/lib/ai/brain";
import { HubLayout } from "@/components/hub/HubLayout";
import { HubStatCard } from "@/components/hub/HubStatCard";
import { PremiumSectionCard } from "@/components/hub/PremiumSectionCard";
import { HubQuickActionsRow } from "@/components/hub/HubQuickActionsRow";
import { AiActionCenter } from "@/components/ai/AiActionCenter";
import { RecommendedForYou } from "@/components/ai/RecommendedForYou";
import { RentHubAiSection } from "@/components/ai/RentHubAiSection";

export default async function RealEstateHubPage() {
  const role = await getUserRole();
  const theme = getHubTheme("realEstate");
  const fallbacks = getAiFallbacksForHub("realEstate") as {
    listingScore?: { score: number; summary: string };
    marketing?: { headline: string; body: string; cta: string };
  };

  const recommendations = [
    {
      id: "1",
      title: "Improve listing score",
      description: fallbacks.listingScore?.summary ?? "Add more photos and a detailed description to boost visibility.",
      urgency: "medium" as const,
      actionLabel: "Optimize listing",
      actionHref: "/dashboard/listings",
    },
    {
      id: "2",
      title: "Generate marketing copy",
      description: fallbacks.marketing?.body ?? "Use AI to generate headlines and CTAs for your listings.",
      urgency: "low" as const,
      actionLabel: "Open design templates",
      actionHref: "/design-templates",
    },
  ];

  return (
    <HubLayout
      title={PLATFORM_IMMOBILIER_HUB_NAME}
      hubKey="realEstate"
      navigation={hubNavigation.realEstate}
      showAdminInSwitcher={isHubAdminRole(role)}
      quickActions={
        <HubQuickActionsRow
          accent={theme.accent}
          actions={[
            { label: "Create listing", href: "/dashboard/listings" },
            { label: "Optimize listing", href: "/dashboard/listings" },
            { label: "Generate marketing", href: "/design-templates" },
            { label: "Open templates", href: "/design-templates" },
          ]}
        />
      }
    >
      <div className="space-y-8">
        {/* Listings overview */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.text }}>
            Listings overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HubStatCard theme={theme} label="Active listings" value="—" sub="Published" accent={theme.accent} />
            <HubStatCard theme={theme} label="AI listing score" value={fallbacks.listingScore?.score ?? "—"} sub="Overall" accent={theme.accent} />
            <HubStatCard theme={theme} label="Leads (30d)" value="—" sub="Snapshot" accent={theme.accent} />
            <HubStatCard theme={theme} label="Views (30d)" value="—" sub="Analytics" accent={theme.accent} />
          </div>
        </section>

        {/* AI Action Center */}
        <AiActionCenter
          hubType="realEstate"
          recommendations={recommendations}
          theme={theme}
          performanceSummary="Listing operations center. Use AI to optimize and market."
        />

        <RentHubAiSection />

        <RecommendedForYou accent={theme.accent} textColor={theme.text} />

        {/* Design tools & analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PremiumSectionCard title="Design tools" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Create visuals and marketing with Design Studio and templates.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/design-templates" className="text-sm font-medium text-blue-700 hover:underline">
                Design templates
              </Link>
              <Link href="/tools/design-studio" className="text-sm font-medium text-blue-700 hover:underline">
                Design Studio
              </Link>
            </div>
          </PremiumSectionCard>
          <PremiumSectionCard title="Analytics snapshot" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Views, leads, and conversion by listing.</p>
            <Link href="/dashboard/listings" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: theme.accent }}>
              View listings →
            </Link>
          </PremiumSectionCard>
        </div>

        {/* Storage & Billing */}
        <div className="grid gap-6 sm:grid-cols-2">
          <PremiumSectionCard title="Storage" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Files and designs.</p>
            <Link href="/dashboard/storage" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: theme.accent }}>
              Open storage
            </Link>
          </PremiumSectionCard>
          <PremiumSectionCard title="Billing" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Plans and usage.</p>
            <Link href="/dashboard/billing" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: theme.accent }}>
              Open billing
            </Link>
          </PremiumSectionCard>
        </div>
      </div>
    </HubLayout>
  );
}
