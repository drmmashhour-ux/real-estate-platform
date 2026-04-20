import { BrokerComplianceDashboard } from "@/components/compliance/BrokerComplianceDashboard";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { evaluateBrokerInsuranceRisk } from "@/modules/compliance/insurance/insurance-risk.engine";
import {
  getBrokerInsuranceStatus,
  getComplianceScoreForBroker,
} from "@/modules/compliance/insurance/insurance.service";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ComplianceDashboardPage() {
  const { userId } = await requireAuthenticatedUser();

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    return (
      <div className="p-8 text-center text-sm text-zinc-400">
        Insurance &amp; compliance workspace is available to verified brokers.
      </div>
    );
  }

  const [status, score, risk] = await Promise.all([
    getBrokerInsuranceStatus(userId),
    getComplianceScoreForBroker(userId),
    evaluateBrokerInsuranceRisk({ brokerId: userId }),
  ]);

  return (
    <BrokerComplianceDashboard
      initialStatus={{
        hasPolicy: status.hasPolicy,
        status: status.status,
        message: status.message,
        policy: status.policy,
      }}
      initialScore={score}
      initialRisk={risk}
    />
  );
}
