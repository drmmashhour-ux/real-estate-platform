import { GrowthLeadsDashboardClient } from "@/components/growth-leads/GrowthLeadsDashboardClient";

export const dynamic = "force-dynamic";

export default function GrowthLeadsDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <GrowthLeadsDashboardClient />
    </div>
  );
}
