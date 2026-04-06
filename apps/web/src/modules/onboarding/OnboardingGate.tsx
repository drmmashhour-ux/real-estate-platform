import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const SKIP_ONBOARDING_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export async function OnboardingGate({ userId, children }: { userId: string; children: ReactNode }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, launchOnboardingCompletedAt: true },
  });
  if (!user || SKIP_ONBOARDING_ROLES.has(user.role) || user.launchOnboardingCompletedAt) {
    return <>{children}</>;
  }
  redirect("/onboarding");
}
