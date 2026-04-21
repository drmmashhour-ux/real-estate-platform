import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { BrokerLecipmOnboardingWizard } from "@/components/broker-onboarding/BrokerLecipmOnboardingWizard";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";

export const dynamic = "force-dynamic";

export default async function OnboardingBrokerPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/broker");

  const completed = await prisma.launchEvent.findFirst({
    where: { userId, event: "broker_lecipm_onboarding_completed" },
    select: { id: true },
  });
  if (completed) {
    redirect(dashboardPathForPersona("BROKER"));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, phone: true },
  });
  if (!user?.email) redirect("/auth/login?next=/onboarding/broker");

  return (
    <MarketplaceOnboardingLayout
      title="Broker onboarding"
      description="Seven steps to activate LECIPM — account, profile, coverage, listings, AI listing, dashboard intro, and your first action. Skip any step or exit anytime."
    >
      <BrokerLecipmOnboardingWizard initialName={user.name} initialEmail={user.email} initialPhone={user.phone} />
    </MarketplaceOnboardingLayout>
  );
}
