import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { BrokerVerificationBadge } from "@/components/brokers/BrokerVerificationBadge";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { MarketplaceOnboardingForm } from "@/components/marketplace/MarketplaceOnboardingForm";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";
import { isTrustGraphBrokerBadgeEnabled } from "@/lib/trustgraph/config";

export const dynamic = "force-dynamic";

export default async function OnboardingBrokerPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/broker");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marketplacePersona: true, role: true, name: true, phone: true },
  });
  const showBrokerBadge = isTrustGraphBrokerBadgeEnabled();
  if (user?.marketplacePersona === "BROKER") {
    redirect(dashboardPathForPersona("BROKER"));
  }

  return (
    <MarketplaceOnboardingLayout
      title="Real estate broker onboarding"
      description="We will save your marketplace profile. Full licensing verification and CRM access still follow your existing broker workflow and role checks."
    >
      {showBrokerBadge ? (
        <div className="mt-6">
          <BrokerVerificationBadge />
        </div>
      ) : null}
      {user?.role !== "BROKER" && user?.role !== "ADMIN" ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          Your account is not a certified broker yet. Complete broker application from the main dashboard if you
          represent an agency, or continue to save this preference for future upgrades.
        </p>
      ) : null}
      <MarketplaceOnboardingForm persona="BROKER" redirectPath="/dashboard/broker" />
    </MarketplaceOnboardingLayout>
  );
}
