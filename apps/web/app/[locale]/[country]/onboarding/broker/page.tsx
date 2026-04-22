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
      description="Launch path: profile setup → optional licence verification → first transaction (LEC-SD file) → guided tutorial. Québec-first rollout (OACIQ): finish onboarding to activate reporting and SD workspace."
    >
      <BrokerLecipmOnboardingWizard initialName={user.name} initialEmail={user.email} initialPhone={user.phone} />
    </MarketplaceOnboardingLayout>
  );
}
