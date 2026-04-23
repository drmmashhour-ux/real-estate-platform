import { MarketingWeekPlanDashboard } from "@/components/marketing/MarketingWeekPlanDashboard";

export const dynamic = "force-dynamic";

export default async function MarketingWeekPlanPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <MarketingWeekPlanDashboard />
    </div>
  );
}
