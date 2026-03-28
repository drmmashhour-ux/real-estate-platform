import { DailyDashboardClient } from "./daily-dashboard-client";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { InboxSummaryCards } from "@/components/notifications/InboxSummaryCards";

const GOLD = "var(--color-premium-gold)";

export const metadata = {
  title: "Daily action | Admin",
  description: "Daily sales checklist and performance snapshot.",
};

export default async function DashboardAdminDailyPage() {
  const { userId } = await requireAuthenticatedUser();

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
        Execution
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Daily action dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
        Checklist + optional manual call counter. Performance pulls live counts for leads and closed deals.
      </p>
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">Platform inbox</h2>
        <InboxSummaryCards userId={userId} />
      </section>
      <DailyDashboardClient />
    </div>
  );
}
