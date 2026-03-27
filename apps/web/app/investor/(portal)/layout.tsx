import { requireInvestorUser } from "@/lib/auth/require-investor";
import { InvestorShell } from "@/components/investor/InvestorShell";
import { PlatformLegalGate } from "@/components/legal/PlatformLegalGate";
import { getPlatformLegalGateStatus } from "@/lib/legal/platform-legal-status";

export default async function InvestorPortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await requireInvestorUser();
  const legal = await getPlatformLegalGateStatus(userId);
  return (
    <InvestorShell>
      <PlatformLegalGate
        needsPlatformIntermediary={legal.needsPlatformIntermediary}
        needsBrokerCollaboration={legal.needsBrokerCollaboration}
      >
        {children}
      </PlatformLegalGate>
    </InvestorShell>
  );
}
