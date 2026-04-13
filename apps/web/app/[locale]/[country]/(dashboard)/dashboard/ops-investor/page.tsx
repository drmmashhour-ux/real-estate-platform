import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { canAccessInvestorDashboard } from "@/lib/investor/access";
import { fetchInvestorMetricsSnapshot, parseInvestorTimeWindow } from "@/lib/investor/metrics";
import { OpsInvestorDashboardClient } from "./OpsInvestorDashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: Promise<{ window?: string }> };

export default async function OpsInvestorMetricsPage({ searchParams }: Props) {
  const uid = await getGuestId();
  if (!uid) {
    redirect("/auth/login?returnUrl=/dashboard/ops-investor");
  }
  if (!(await canAccessInvestorDashboard(uid))) {
    redirect("/dashboard");
  }

  const sp = (await searchParams) ?? {};
  const window = parseInvestorTimeWindow(typeof sp.window === "string" ? sp.window : undefined);
  const snapshot = await fetchInvestorMetricsSnapshot(window);

  return <OpsInvestorDashboardClient initial={snapshot} />;
}
