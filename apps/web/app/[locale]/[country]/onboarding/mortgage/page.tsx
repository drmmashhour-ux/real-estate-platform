import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { MarketplaceOnboardingForm } from "@/components/marketplace/MarketplaceOnboardingForm";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";

export const dynamic = "force-dynamic";

export default async function OnboardingMortgagePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/mortgage");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marketplacePersona: true, role: true },
  });
  if (user?.marketplacePersona === "MORTGAGE_BROKER") {
    redirect(dashboardPathForPersona("MORTGAGE_BROKER"));
  }

  return (
    <MarketplaceOnboardingLayout
      title="Mortgage specialist onboarding"
      description="You will use the mortgage expert hub for profile, leads, and deal tracking. Saving here links your account to the mortgage dashboard."
    >
      {!isMortgageExpertRole(user?.role) && user?.role !== "ADMIN" ? (
        <p className="mt-6 rounded-xl border border-sky-500/30 bg-sky-950/30 p-4 text-sm text-sky-100">
          Expert tools unlock after your role is set to mortgage specialist. You can still save this preference now.
        </p>
      ) : null}
      <MarketplaceOnboardingForm persona="MORTGAGE_BROKER" redirectPath="/dashboard/mortgage" />
    </MarketplaceOnboardingLayout>
  );
}
