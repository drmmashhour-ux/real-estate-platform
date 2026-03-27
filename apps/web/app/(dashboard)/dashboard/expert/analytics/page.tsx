import { ExpertAnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default function ExpertAnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#C9A646]">Analytics</h1>
      <p className="mt-2 text-sm text-[#B3B3B3]">Performance, conversion, and monetization snapshot.</p>
      <ExpertAnalyticsClient />
    </div>
  );
}
