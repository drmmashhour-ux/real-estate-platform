import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { LogoutForm } from "@/components/LogoutForm";
import { syriaFlags } from "@/lib/platform-flags";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations("Admin");
  const mvp = syriaFlags.SYRIA_MVP;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-amber-950">{t("shellTitle")}</h1>
          <p className="text-sm text-amber-900/80">{t("shellSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-amber-950">
          <Link href="/admin/listings" className="hover:underline">
            {t("navListings")}
          </Link>
          <Link href="/admin/listing-messages" className="hover:underline">
            {t("navListingMessages")}
          </Link>
          <Link href="/admin/bookings" className="hover:underline">
            {t("navBookings")}
          </Link>
          <Link href="/admin/sybnb/bookings" className="hover:underline">
            {t("navSybnbBookings")}
          </Link>
          <Link href="/admin/sybnb/reports" className="hover:underline">
            {t("navSybnbReports")}
          </Link>
          <Link href="/admin/sybnb/properties" className="hover:underline">
            {t("navSybnbProperties")}
          </Link>
          <Link href="/admin/sybnb/hotels" className="hover:underline">
            {t("navSybnbHotels")}
          </Link>
          <Link href="/admin/sybnb/hotel-retention" className="hover:underline">
            {t("navSybnbHotelRetention")}
          </Link>
          <Link href="/admin/sybnb/analytics" className="hover:underline">
            {t("navSybnbAnalytics")}
          </Link>
          <Link href="/admin/sybnb/performance" className="hover:underline">
            {t("navSybnbPerformance")}
          </Link>
          <Link href="/admin/sybnb/agents" className="hover:underline">
            {t("navSybnbAgents")}
          </Link>
          <Link href="/admin/investor" className="hover:underline">
            {t("navInvestorReadiness")}
          </Link>
          <Link href="/admin/sybnb/daily" className="hover:underline">
            {t("navDailyExecution")}
          </Link>
          <Link href="/admin/sybnb/follow-ups" className="hover:underline">
            {t("navSybnbFollowUps")}
          </Link>
          <Link href="/admin/sybnb/workflow" className="hover:underline">
            {t("navSybnbWorkflow")}
          </Link>
          <Link href="/admin/sybnb/semi-automation" className="hover:underline">
            {t("navSybnbSemiAutomation")}
          </Link>
          <Link href="/admin/sybnb/flywheel" className="hover:underline">
            {t("navSybnbFlywheel")}
          </Link>
          <Link href="/admin/sybnb/agent-program" className="hover:underline">
            {t("navSybnbAgentProgram")}
          </Link>
          <Link href="/admin/sybnb/revenue-optimization" className="hover:underline">
            {t("navSybnbRevenueOptimization")}
          </Link>
          <Link href="/admin/sybnb/revenue-10k" className="hover:underline">
            {t("navSybnbRevenue10k")}
          </Link>
          <Link href="/admin/sybnb/team-system" className="hover:underline">
            {t("navSybnbTeamSystem")}
          </Link>
          <Link href="/admin/sybnb/market-domination" className="hover:underline">
            {t("navSybnbMarketDomination")}
          </Link>
          <Link href="/admin/sybnb/page-weight" className="hover:underline">
            {t("navSybnbPageWeight")}
          </Link>
          <Link href="/admin/sybnb/low-connectivity" className="hover:underline">
            {t("navSybnbLowConnectivity")}
          </Link>
          <Link href="/admin/sybnb/expansion-readiness" className="hover:underline">
            {t("navSybnbExpansionReadiness")}
          </Link>
          <Link href="/admin/sybnb/agent-commission" className="hover:underline">
            {t("navSybnbAgentCommission")}
          </Link>
          <Link href="/admin/payouts" className="hover:underline">
            {t("navPayouts")}
          </Link>
          <Link href="/admin/payments" className="hover:underline">
            {t("navPayments")}
          </Link>
          <Link href="/admin/payments-monitor" className="hover:underline">
            {t("navPaymentsMonitor")}
          </Link>
          <Link href="/admin/dr-brain" className="hover:underline">
            {t("navDrBrain")}
          </Link>
          <Link href="/admin/payment-requests" className="hover:underline">
            {t("navF1Payments")}
          </Link>
          <Link href="/admin/stats" className="hover:underline">
            {t("navStats")}
          </Link>
          {!mvp ? (
            <Link href="/admin/promotions" className="hover:underline">
              {t("navPromotions")}
            </Link>
          ) : null}
          {!mvp ? (
            <Link href="/admin/growth" className="hover:underline">
              {t("navGrowth")}
            </Link>
          ) : null}
          {!mvp ? (
            <Link href="/admin/autonomy" className="hover:underline">
              {t("navAutonomy")}
            </Link>
          ) : null}
          <Link href="/admin/users" className="hover:underline">
            {t("navUsers")}
          </Link>
          <Link href="/admin/demo-sybnb" className="hover:underline">
            Demo SYBNB
          </Link>
          <Link href="/admin/demo-control" className="hover:underline">
            Demo control
          </Link>
          {!mvp ? (
            <Link href="/admin/listing-assistant" className="hover:underline">
              {t("navListingAssistant")}
            </Link>
          ) : null}
          <Link href="/" className="hover:underline">
            {t("navSite")}
          </Link>
          <LogoutForm />
        </div>
      </div>
      {children}
    </div>
  );
}
