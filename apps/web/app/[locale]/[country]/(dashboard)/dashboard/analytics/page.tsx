import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { resolveUnifiedAnalyticsAccess } from "@/modules/analytics/unified-analytics/unified-analytics-access";
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardAnalyticsPage() {
  const uid = await getGuestId();
  if (!uid) {
    redirect("/auth/login?returnUrl=/dashboard/analytics");
  }

  const access = await resolveUnifiedAnalyticsAccess(uid);
  if (!access.allowed) {
    redirect("/dashboard");
  }

  return <AnalyticsDashboardClient initialView={access.view} />;
}
