import { DrBrainPanel } from "@/components/admin/DrBrainPanel";
import { explainDrBrainIssues } from "@/lib/drbrain/explanations";
import { countDrBrainApiLikeSignals24h, getDrBrainMetrics } from "@/lib/drbrain/metrics";
import { predictUpcomingIssues } from "@/lib/drbrain/predictive";
import {
  DEMO_DRBRAIN_TICKETS,
  DRBRAIN_INVESTOR_DEMO_KPIS,
  buildSyriaInvestorDemoExplanation,
  buildSyriaInvestorDemoMetrics,
  buildSyriaInvestorDemoPredictive,
} from "@/lib/drbrain/demo-data";
import { loadSyriaDrBrainTicketsFromAudit } from "@/lib/drbrain/ticket-audit";
import { runSyriaDrBrainReport } from "@/lib/drbrain";
import { requireAdmin } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function SyriaAdminDrBrainPage() {
  await requireAdmin();
  const t = await getTranslations("Admin");

  const investorDemo = process.env.DRBRAIN_INVESTOR_DEMO_MODE?.trim().toLowerCase() === "true";

  let apiLikeSignals24h = 0;

  const report = await runSyriaDrBrainReport();

  let metrics;
  let explanation;
  let predictive;
  let tickets;

  if (investorDemo) {
    metrics = buildSyriaInvestorDemoMetrics();
    explanation = buildSyriaInvestorDemoExplanation();
    predictive = buildSyriaInvestorDemoPredictive();
    tickets = DEMO_DRBRAIN_TICKETS;
    apiLikeSignals24h = 42;
  } else {
    const [liveMetrics, apiSignals] = await Promise.all([getDrBrainMetrics(), countDrBrainApiLikeSignals24h()]);
    metrics = liveMetrics;
    apiLikeSignals24h = apiSignals;
    explanation = explainDrBrainIssues(report);
    predictive = predictUpcomingIssues(metrics);
    tickets = await loadSyriaDrBrainTicketsFromAudit();
  }

  const totalsAttempts = metrics.paymentAttempts.reduce((a, b) => a + b, 0);
  const totalsBlocked = metrics.blockedPayments.reduce((a, b) => a + b, 0);

  const chartLabels = {
    paymentsLine: t("drbrainChartPaymentsLine"),
    blockedLine: t("drbrainChartBlockedLine"),
    payoutBar: t("drbrainChartPayoutBar"),
    anomalyLine: t("drbrainChartAnomalyLine"),
    errorRateLine: t("drbrainChartErrorRateLine"),
    totalsHint: t("drbrainTotalsHint", {
      attempts: totalsAttempts,
      blocked: totalsBlocked,
      apiish: apiLikeSignals24h,
    }),
  };

  const extendedLabels = {
    issuesTitle: t("drbrainIssuesSection"),
    recommendationsTitle: t("drbrainRecommendationsSection"),
    maintenanceTitle: t("drbrainMaintenanceSection"),
    aiSectionTitle: t("drbrainAiSectionTitle"),
    predictiveSectionTitle: t("drbrainPredictiveSectionTitle"),
    predictiveLead: t("drbrainPredictiveLead"),
    summaryLabel: t("drbrainSummaryLabel"),
    causesLabel: t("drbrainCausesLabel"),
    impactLabel: t("drbrainImpactLabel"),
    recommendedActionsLabel: t("drbrainRecommendedActionsLabel"),
    investorDemoRibbon: t("drbrainInvestorDemoRibbon"),
    ticketUi: {
      sectionTitle: t("drbrainTicketsSection"),
      ack: t("drbrainTicketAck"),
      resolve: t("drbrainTicketResolve"),
      ignore: t("drbrainTicketIgnore"),
      recommendedSummary: t("drbrainTicketRecommendedSummary"),
      working: t("drbrainTicketWorking"),
      demoNotice: t("drbrainTicketDemoNotice"),
      empty: t("drbrainTicketEmpty"),
    },
    checklistTitle: t("drbrainDay1ChecklistTitle"),
    checklistItems: {
      preflight: t("drbrainDay1Preflight"),
      webhook: t("drbrainDay1Webhook"),
      escrow: t("drbrainDay1Escrow"),
      killSwitch: t("drbrainDay1KillSwitch"),
      noCriticalTickets: t("drbrainDay1NoCriticalTickets"),
      dbHealthy: t("drbrainDay1DbHealthy"),
      buildVersion: t("drbrainDay1BuildVersion"),
    },
    storyUi: {
      title: t("drbrainStoryTitle"),
      runDemo: t("drbrainStoryRunDemo"),
      s1: t("drbrainStoryS1"),
      s2: t("drbrainStoryS2"),
      s3: t("drbrainStoryS3"),
      s4: t("drbrainStoryS4"),
      s5: t("drbrainStoryS5"),
      s6: t("drbrainStoryS6"),
      demoHint: t("drbrainStoryDemoHint"),
    },
  };

  return (
    <div data-demo-highlight="drbrain" className="space-y-6">
      <DrBrainPanel
        title={t("drbrainTitle")}
        report={report}
        metrics={metrics}
        explanation={explanation}
        predictive={predictive}
        chartLabels={chartLabels}
        sectionLabels={extendedLabels}
        investorDemo={investorDemo}
        demoKpis={investorDemo ? DRBRAIN_INVESTOR_DEMO_KPIS : undefined}
        tickets={tickets}
      />
    </div>
  );
}
