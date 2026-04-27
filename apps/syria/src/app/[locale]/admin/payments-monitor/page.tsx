import { getTranslations } from "next-intl/server";
import { SybnbPaymentsMonitor } from "@/components/admin/SybnbPaymentsMonitor";
import {
  evaluateSybnbMonitoringAlerts,
  getSybnbPaymentStats,
  getSybnbRecentEvents,
} from "@/lib/sybnb/monitoring";

export default async function AdminPaymentsMonitorPage() {
  const t = await getTranslations("Admin");
  const [stats, events] = await Promise.all([getSybnbPaymentStats(), getSybnbRecentEvents(20)]);
  await evaluateSybnbMonitoringAlerts();

  return (
    <SybnbPaymentsMonitor
      stats={stats}
      events={events}
      labels={{
        title: t("paymentsMonitorTitle"),
        intro: t("paymentsMonitorIntro"),
        attempts: t("paymentsMonitorAttempts"),
        blocked: t("paymentsMonitorBlocked"),
        webhookPaid: t("paymentsMonitorWebhookPaid"),
        payoutsSection: t("paymentsMonitorPayoutEscrow"),
        recent: t("paymentsMonitorRecent"),
        tableEvent: t("paymentsMonitorColEvent"),
        tableWhen: t("paymentsMonitorColWhen"),
        tableBooking: t("paymentsMonitorColBooking"),
        tableSummary: t("paymentsMonitorColSummary"),
        payoutHeld: t("paymentsMonitorPayoutHeld"),
        payoutEligible: t("paymentsMonitorPayoutEligible"),
        payoutReleased: t("paymentsMonitorPayoutReleased"),
        payoutBlocked: t("paymentsMonitorPayoutBlocked"),
      }}
    />
  );
}
