import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { AccountLegalStrip } from "@/components/dashboard/AccountLegalStrip";
import { DashboardGuideBanner } from "@/components/dashboard/DashboardGuideBanner";
import { PlatformLegalGate } from "@/components/legal/PlatformLegalGate";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getPlatformLegalGateStatus } from "@/lib/legal/platform-legal-status";

export default async function DashboardSectionLayout({ children }: { children: ReactNode }) {
  const { userId: id } = await requireAuthenticatedUser();
  let showGuide = false;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  showGuide = user?.role === "BROKER" || user?.role === "ADMIN";

  const legal = await getPlatformLegalGateStatus(id);

  return (
    <>
      {showGuide ? <DashboardGuideBanner /> : null}
      <AccountLegalStrip userId={id} />
      <PlatformLegalGate
        needsPlatformIntermediary={legal.needsPlatformIntermediary}
        needsBrokerCollaboration={legal.needsBrokerCollaboration}
      >
        {children}
      </PlatformLegalGate>
    </>
  );
}
