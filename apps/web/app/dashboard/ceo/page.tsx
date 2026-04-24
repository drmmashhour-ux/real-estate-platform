import { HubLayout } from "@/components/layout/HubLayout";
import { CeoDashboardClient } from "./CeoDashboardClient";
import { CeoStrategySnapshotService } from "@/modules/ceo-ai/ceo-strategy-snapshot.service";
import { prisma } from "@/lib/db";
import { CeoWeeklyPlanEngine } from "@/modules/ceo/engines/ceo-weekly-plan.engine";

export const metadata = {
  title: "CEO Strategic Hub | LECIPM",
};

export default async function CeoDashboardPage() {
  const [snapshotAI, snapshotStrategic] = await Promise.all([
    CeoStrategySnapshotService.buildCeoStrategySnapshot(),
    prisma.ceoSnapshot.findFirst({ orderBy: { createdAt: "desc" } })
  ]);

  const weeklyPlan = snapshotStrategic ? await CeoWeeklyPlanEngine.generateWeeklyPlan(snapshotStrategic.id) : null;

  return (
    <HubLayout activeSection="CEO">
      <CeoDashboardClient 
        initialSnapshot={snapshotAI} 
        strategicSnapshot={snapshotStrategic}
        weeklyPlan={weeklyPlan}
      />
    </HubLayout>
  );
}
