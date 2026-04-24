import * as React from "react";
import { prisma } from "@repo/db";
import { AccountLegalStrip } from "@/components/dashboard/AccountLegalStrip";
import { DashboardGuideBanner } from "@/components/dashboard/DashboardGuideBanner";
import { PlatformLegalGate } from "@/components/legal/PlatformLegalGate";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getPlatformLegalGateStatus } from "@/lib/legal/platform-legal-status";
import { BrokerAssistantFloating } from "@/components/assistant/BrokerAssistantFloating";
import { BrokerageOaciqDisclaimer } from "@/components/compliance/BrokerageOaciqDisclaimer";
import { OnboardingGate } from "@/src/modules/onboarding/OnboardingGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardSectionLayout({ children }: { children: React.ReactNode }) {
  const { userId: id } = await requireAuthenticatedUser();
  let showGuide = false;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  showGuide = user?.role === "BROKER" || user?.role === "ADMIN";

  const legal = await getPlatformLegalGateStatus(id);

  return (
    <OnboardingGate userId={id}>
      {showGuide ? <BrokerAssistantFloating /> : null}
      {showGuide ? <DashboardGuideBanner /> : null}
      <AccountLegalStrip userId={id} />
      <PlatformLegalGate
        needsPlatformIntermediary={legal.needsPlatformIntermediary}
        needsBrokerCollaboration={legal.needsBrokerCollaboration}
      >
        {showGuide ? (
          <div className="mx-auto w-full max-w-6xl px-4 pt-4">
            <BrokerageOaciqDisclaimer />
          </div>
        ) : null}
        {children}
      </PlatformLegalGate>
    </OnboardingGate>
  );
}
