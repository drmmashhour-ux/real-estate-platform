import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { MarketplaceOnboardingForm } from "@/components/marketplace/MarketplaceOnboardingForm";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";

export const dynamic = "force-dynamic";

export default async function OnboardingBuyerPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/buyer");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marketplacePersona: true },
  });
  if (user?.marketplacePersona === "BUYER") {
    redirect(dashboardPathForPersona("BUYER"));
  }

  return (
    <MarketplaceOnboardingLayout
      title="Buyer onboarding"
      description="Tell us how to reach you. You will land on your buyer hub with saved listings, requests, and messages."
    >
      <MarketplaceOnboardingForm persona="BUYER" redirectPath="/dashboard/buyer" />
    </MarketplaceOnboardingLayout>
  );
}
