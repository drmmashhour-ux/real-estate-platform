import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { OnboardingClient } from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?returnUrl=/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { launchOnboardingCompletedAt: true, role: true },
  });

  if (!user) {
    redirect("/auth/login?returnUrl=/onboarding");
  }

  if (user.launchOnboardingCompletedAt) {
    redirect("/dashboard");
  }

  return <OnboardingClient />;
}
