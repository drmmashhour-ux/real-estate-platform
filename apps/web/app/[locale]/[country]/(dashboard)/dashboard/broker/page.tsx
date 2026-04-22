import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { getListingIdsForBroker } from "@/lib/broker/collaboration";
import { isComplianceComplete } from "@/services/compliance/coownershipCompliance.service";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { getAiFallbacksForHub } from "@/lib/ai/brain";
import { HubLayout } from "@/components/hub/HubLayout";
import { HubStatCard } from "@/components/hub/HubStatCard";
import { PremiumSectionCard } from "@/components/hub/PremiumSectionCard";
import { BrokerImmoLeadsPanel } from "./components/BrokerImmoLeadsPanel";
import { BrokerProjectLeads } from "./components/BrokerProjectLeads";
import { BrokerContactInquiries } from "./components/BrokerContactInquiries";
import { BrokerProjectReservations } from "./components/BrokerProjectReservations";
import { BrokerAiPanel } from "./components/BrokerAiPanel";
import { BrokerHubAiSection } from "@/components/ai/BrokerHubAiSection";
import { BrokerLeadSummaryAiCard } from "@/components/ai/BrokerLeadSummaryAiCard";
import { SharedListingsSection } from "./components/SharedListingsSection";
import { AiActionCenter } from "@/components/ai/AiActionCenter";
import { PhoneCallUs } from "@/components/phone/PhoneCallUs";
import { BrokerCityMarketSnapshot } from "@/components/broker/BrokerCityMarketSnapshot";
import { InboxSummaryCards } from "@/components/notifications/InboxSummaryCards";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { BrokerExecutiveSnapshot } from "@/components/dashboard/lecipm/BrokerExecutiveSnapshot";
import { BrokerDistributionPerformance } from "@/components/broker/BrokerDistributionPerformance";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import { RecommendationBanner } from "@/components/conversion/RecommendationBanner";
import { NextActionPanel } from "@/components/conversion/NextActionPanel";
import { AIInsightPanel } from "@/components/conversion/AIInsightPanel";
import { InlineUpgradeBanner } from "@/components/conversion/InlineUpgradeBanner";
import { conversionCopy } from "@/src/design/conversionCopy";
import {
  brokerAiAssistFlags,
  brokerClosingFlags,
  brokerIncentivesFlags,
  brokerIncentivesPanelFlags,
  brokerPerformanceFlags,
  brokerPerformancePanelFlags,
  brokerServiceProfileFlags,
} from "@/config/feature-flags";
import { BrokerAiAssistDailyPanel } from "@/components/broker/BrokerAiAssistDailyPanel";
import { BrokerDealConversionConsole } from "@/components/broker/BrokerDealConversionConsole";
import { BrokerIncentivesPanel } from "@/components/broker/BrokerIncentivesPanel";
import { BrokerPerformancePanel } from "@/components/broker/BrokerPerformancePanel";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { legalHubFlags } from "@/config/feature-flags";
import { LegalHubEntryCard } from "@/components/legal/LegalHubEntryCard";
import { TrustGrowthPrompt } from "@/components/growth/TrustGrowthPrompt";
import { CollaborationStrip } from "@/components/collaboration/CollaborationStrip";
import { ImmoDealRoomEntry } from "@/components/immo-deal-room/ImmoDealRoomEntry";
import { BrokerServiceProfilePanel } from "@/components/broker/BrokerServiceProfilePanel";
import { BrokerLegalComplianceStrip } from "@/components/broker/BrokerLegalComplianceStrip";
import { CoOwnershipBrokerCondoPanel } from "@/components/compliance/CoOwnershipBrokerCondoPanel";
import { BrokerGreenIntelligenceSection } from "@/components/broker/BrokerGreenIntelligenceSection";
import { BrokerHubMonetizationBanner } from "@/components/broker/BrokerHubMonetizationBanner";

function fmtCommissionCents(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function BrokerHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  const role = await getUserRole();
  const theme = getHubTheme("broker");
  const fallbacks = getAiFallbacksForHub("broker") as {
    nextAction?: { action: string; closeProbabilityPct: number; leadFitScore?: number };
    closeProbability?: number;
  };

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;

  let overviewStats = { activeClients: "—", activeListings: "—", newLeads: "—", closedDeals: "—" };
  let commissionStats = { estimatedOpen: "—", closedCommissions: "—", pendingDeals: "—" };
  let contentReminderStats = { dueNow: "—", upcoming: "—", planned: "—" };

  if (userId && dbUser?.role === "BROKER") {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const [activeClients, activeListings, newLeads, closedDeals, pendingCents, paidCents, pendingOffers, contentPacks] =
      await Promise.all([
        prisma.brokerClient.count({ where: { brokerId: userId, status: { not: "LOST" } } }),
        prisma.brokerListingAccess.count({ where: { brokerId: userId } }),
        prisma.brokerClient.count({
          where: {
            brokerId: userId,
            createdAt: { gte: weekAgo },
            status: { in: ["LEAD", "CONTACTED", "QUALIFIED"] },
          },
        }),
        prisma.brokerClient.count({ where: { brokerId: userId, status: "CLOSED" } }),
        prisma.brokerCommission.aggregate({
          where: { brokerId: userId, status: "pending" },
          _sum: { brokerAmountCents: true },
        }),
        prisma.brokerCommission.aggregate({
          where: { brokerId: userId, status: "paid" },
          _sum: { brokerAmountCents: true },
        }),
        prisma.offer.count({
          where: {
            brokerId: userId,
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "COUNTERED"] },
          },
        }),
        prisma.formSubmission.findMany({
          where: {
            formType: "broker_content_pack",
            assignedTo: userId,
          },
          select: {
            payloadJson: true,
          },
          take: 100,
        }),
      ]);
    overviewStats = {
      activeClients: String(activeClients),
      activeListings: String(activeListings),
      newLeads: String(newLeads),
      closedDeals: String(closedDeals),
    };
    commissionStats = {
      estimatedOpen: fmtCommissionCents(pendingCents._sum.brokerAmountCents),
      closedCommissions: fmtCommissionCents(paidCents._sum.brokerAmountCents),
      pendingDeals: String(pendingOffers),
    };
    const now = new Date();
    const reminderQueue = contentPacks
      .map((row) => (row.payloadJson ?? {}) as Record<string, unknown>)
      .filter(
        (payload) =>
          payload.campaignStatus === "planned" &&
          typeof payload.plannedFor === "string" &&
          typeof payload.reminderHoursBefore === "number" &&
          !payload.reminderDismissedAt
      )
      .map((payload) => {
        const plannedFor = new Date(String(payload.plannedFor));
        const reminderAt = new Date(
          plannedFor.getTime() - Number(payload.reminderHoursBefore) * 60 * 60 * 1000
        );
        return { plannedFor, reminderAt };
      })
      .filter((item) => !Number.isNaN(item.plannedFor.getTime()) && !Number.isNaN(item.reminderAt.getTime()));
    contentReminderStats = {
      dueNow: String(reminderQueue.filter((item) => item.reminderAt <= now).length),
      upcoming: String(reminderQueue.filter((item) => item.reminderAt > now).length),
      planned: String(reminderQueue.length),
    };
  }

  let coownershipIncompleteCount = 0;
  if (userId && dbUser?.role === "BROKER") {
    const ids = await getListingIdsForBroker(userId);
    if (ids.length > 0) {
      const coRows = await prisma.listing.findMany({
        where: {
          id: { in: ids },
          OR: [{ listingType: "CONDO" }, { isCoOwnership: true }],
        },
        select: { id: true },
      });
      for (const r of coRows) {
        if (!(await isComplianceComplete(r.id))) {
          coownershipIncompleteCount++;
        }
      }
    }
  }

  const sampleLead = await prisma.lead.findFirst({ orderBy: { createdAt: "desc" } });
  const brokerDecision = await safeEvaluateDecision({
    hub: "broker",
    userId: userId ?? "demo",
    userRole: dbUser?.role ?? "USER",
    entityType: sampleLead ? "lead" : "platform",
    entityId: sampleLead?.id ?? null,
  });

  const brokerRecommendations = [
    {
      id: "1",
      title: "Lead prioritization",
      description: "Focus on high-score leads first. AI suggests next action per lead in the pipeline.",
      urgency: "high" as const,
      actionLabel: "Open pipeline",
      actionHref: "#immo-leads",
    },
    {
      id: "2",
      title: "Lead fit score",
      description: `Rule-based fit scores (0–100) from lead signals — not a closing forecast. Example: ${fallbacks.nextAction?.leadFitScore ?? fallbacks.nextAction?.closeProbabilityPct ?? fallbacks.closeProbability ?? 50}. Follow up within 24h when fit is strong.`,
      urgency: "medium" as const,
      actionLabel: "View leads",
      actionHref: "/dashboard/leads",
    },
  ];

  return (
    <HubLayout
      title="Broker"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={isHubAdminRole(role)}
      showWorkspaceBadge
    >
      <div className="space-y-8">
        <BrokerHubMonetizationBanner locale={locale} country={country} />
        <HubJourneyBanner hub="broker" locale={locale} country={country} userId={userId} />
        {userId && (dbUser?.role === "BROKER" || dbUser?.role === "ADMIN") ? (
          <>
            <BrokerGreenIntelligenceSection locale={locale} country={country} userId={userId} />
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-4 text-sm text-emerald-100">
              <p className="font-semibold text-white">AI Listing Assistant</p>
              <p className="mt-1 text-emerald-100/90">
                You save time, reduce risk, and increase closing probability using AI — validate every output before publish.
              </p>
              <Link
                href={`/${locale}/${country}/dashboard/listings/assistant`}
                className="mt-3 inline-flex font-medium text-emerald-300 underline-offset-4 hover:underline"
              >
                Open Listing Assistant →
              </Link>
            </div>
          </>
        ) : null}
        {coownershipIncompleteCount > 0 ? (
          <div
            className="rounded-xl border border-amber-500/40 bg-amber-950/35 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            ⚠️ You have {coownershipIncompleteCount} listing{coownershipIncompleteCount === 1 ? "" : "s"} with
            incomplete co-ownership compliance.{" "}
            <Link href={`/${locale}/${country}/dashboard/listings`} className="font-medium underline underline-offset-2">
              Review listings
            </Link>
          </div>
        ) : null}
        {userId ? <BrokerLegalComplianceStrip locale={locale} country={country} /> : null}
        {legalHubFlags.legalHubV1 ? (
          <LegalHubEntryCard href={`/${locale}/${country}/legal`} locale={locale} country={country} />
        ) : null}
        {userId && dbUser?.role === "BROKER" ? (
          <TrustGrowthPrompt variant="broker" locale={locale} country={country} />
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-400">
          <PhoneCallUs showLabel={true} />
        </div>
        {userId && (dbUser?.role === "BROKER" || dbUser?.role === "ADMIN") ? (
          <>
            <CollaborationStrip entityType="broker" entityId={userId} headline="Start broker call" />
            <div className="mt-4 max-w-2xl">
              <ImmoDealRoomEntry entityType="broker" entityId={userId} titleHint="Broker workspace" />
            </div>
          </>
        ) : null}
        {userId ? (
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-white">Inbox</h2>
            <p className="mt-1 text-sm text-premium-secondary">Platform messages and alerts</p>
            <div className="mt-5">
              <InboxSummaryCards userId={userId} />
            </div>
          </section>
        ) : null}
        {userId && dbUser?.role === "BROKER" ? (
          <BrokerExecutiveSnapshot
            listingsVerified={overviewStats.activeListings}
            avgTrustScore="—"
            dealsWorthReviewing={commissionStats.pendingDeals}
            revenueOrMrr={commissionStats.estimatedOpen}
          />
        ) : null}
        {userId && dbUser?.role === "BROKER" ? (
          <BrokerDistributionPerformance accent={theme.accent} brokerUserId={userId} />
        ) : null}
        {brokerClosingFlags.brokerClosingV1 && userId && dbUser?.role === "BROKER" ? (
          <BrokerDealConversionConsole accent={theme.accent} />
        ) : null}
        {brokerClosingFlags.brokerClosingV1 &&
        brokerAiAssistFlags.brokerAiAssistV1 &&
        userId &&
        dbUser?.role === "BROKER" ? (
          <BrokerAiAssistDailyPanel accent={theme.accent} />
        ) : null}
        {brokerPerformanceFlags.brokerPerformanceV1 &&
        brokerPerformancePanelFlags.brokerPerformancePanelV1 &&
        userId &&
        dbUser?.role === "BROKER" ? (
          <BrokerPerformancePanel accent={theme.accent} />
        ) : null}
        {brokerIncentivesFlags.brokerIncentivesV1 &&
        brokerIncentivesPanelFlags.brokerIncentivesPanelV1 &&
        userId &&
        dbUser?.role === "BROKER" ? (
          <BrokerIncentivesPanel accent={theme.accent} />
        ) : null}
        {userId && dbUser?.role === "BROKER" ? <CoOwnershipBrokerCondoPanel className="mt-6" /> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <RecommendationBanner
            recommendation={conversionCopy.analysis.recommendationHigh}
            confidence={Number(overviewStats.newLeads) >= 3 ? "high" : "medium"}
          />
          <NextActionPanel
            title={conversionCopy.analysis.nextAction}
            body="Open the broker pipeline to execute recommended actions and move leads to closed deals."
            ctaHref="/dashboard/broker/pipeline"
            ctaLabel="Open priority pipeline"
            secondaryHref="/dashboard/broker/crm"
            secondaryLabel="Open CRM"
          />
        </section>
        <section className="rounded-2xl border border-premium-gold/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(11,11,11,0.95))] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">
                Broker Content
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Launch designs and social content faster</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Open the broker content studio for Adobe Express launch links, listing post copy, seller attraction campaigns, and branded templates for your market.
              </p>
            </div>
            <Link href="/dashboard/broker/content-studio" className="btn-primary min-h-0 px-4 py-2 text-sm">
              Open content studio →
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">
                Content Reminder Queue
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Campaign reminders and scheduled follow-up</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Review due-now reminder tasks, upcoming reminder windows, and planned campaign volume without opening the studio first.
              </p>
            </div>
            <Link href="/dashboard/broker/content-studio" className="btn-secondary min-h-0 px-4 py-2 text-sm">
              Open reminder inbox
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <HubStatCard theme={theme} label="Due now" value={contentReminderStats.dueNow} sub="Reminder actions" accent={theme.accent} />
            <HubStatCard theme={theme} label="Upcoming reminders" value={contentReminderStats.upcoming} sub="Next reminder windows" accent={theme.accent} />
            <HubStatCard theme={theme} label="Planned content" value={contentReminderStats.planned} sub="Queued campaign packs" accent={theme.accent} />
          </div>
        </section>
        <AIInsightPanel
          title="Recommended actions"
          insights={[
            "Focus first on high trust + high deal leads.",
            "Listings with low trust should be verified before showings.",
            "Send follow-up within 24h for best close probability.",
          ]}
        />
        <InlineUpgradeBanner text={conversionCopy.upgrade.subtitle} />
        {/* Broker Overview */}
        <section>
          <p className="section-title mb-1">Pipeline</p>
          <h2 className="text-xl font-semibold tracking-tight text-white">Your top opportunities</h2>
          <p className="mt-1 text-sm text-premium-secondary">Workspace snapshot and quick links</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href="/dashboard/broker/crm" className="btn-primary min-h-0 px-4 py-2 text-sm">
              CRM workspace →
            </Link>
            <Link href="/dashboard/leads" className="btn-secondary min-h-0 px-4 py-2 text-sm">
              All leads
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HubStatCard theme={theme} label="Active clients" value={overviewStats.activeClients} sub="Buyers & sellers" accent={theme.accent} />
            <HubStatCard theme={theme} label="Active listings" value={overviewStats.activeListings} sub="Live" accent={theme.accent} />
            <HubStatCard theme={theme} label="New leads" value={overviewStats.newLeads} sub="This week" accent={theme.accent} />
            <HubStatCard theme={theme} label="Closed deals" value={overviewStats.closedDeals} sub="This month" accent={theme.accent} />
          </div>
          <div className="mt-6 max-w-lg">
            <BrokerCityMarketSnapshot />
          </div>
          {brokerServiceProfileFlags.brokerServiceProfilePanelV1 && dbUser?.role === "BROKER" ? (
            <div className="mt-10">
              <BrokerServiceProfilePanel />
            </div>
          ) : null}
        </section>

        {/* AI Action Center */}
        <AiActionCenter
          hubType="broker"
          recommendations={brokerRecommendations}
          theme={theme}
          performanceSummary="Lead prioritization, close probability, and next action suggestions."
        />

        <DecisionCard
          title="AI Lead Priority"
          result={brokerDecision}
          actionHref="/dashboard/broker/pipeline"
          actionLabel="Open pipeline"
        />

        {/* Shared listings */}
        <section>
          <SharedListingsSection accent={theme.accent} />
        </section>

        <section id="immo-leads">
          <p className="section-title mb-1">Leads</p>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">ImmoContact (platform leads)</h2>
          <BrokerImmoLeadsPanel accent={theme.accent} />
        </section>

        {/* Project Leads */}
        <section>
          <BrokerProjectLeads accent={theme.accent} />
        </section>

        {/* Contact page inquiries (client → broker) */}
        <section>
          <BrokerContactInquiries accent={theme.accent} />
        </section>

        {/* Project Reservations */}
        <section>
          <BrokerProjectReservations accent={theme.accent} />
        </section>

        <div className="grid gap-6 lg:grid-cols-1">
          <BrokerAiPanel />
        </div>

        <BrokerLeadSummaryAiCard
          activeClients={overviewStats.activeClients}
          newLeads={overviewStats.newLeads}
          closedDeals={overviewStats.closedDeals}
        />
        <BrokerHubAiSection activeClients={overviewStats.activeClients} newLeads={overviewStats.newLeads} />

        {/* Commission Snapshot */}
        <PremiumSectionCard title="Commission snapshot" theme={theme} accent={theme.accent}>
          <div className="grid gap-4 sm:grid-cols-3">
            <HubStatCard theme={theme} label="Pending commission" value={commissionStats.estimatedOpen} accent={theme.accent} />
            <HubStatCard theme={theme} label="Paid (broker)" value={commissionStats.closedCommissions} accent={theme.accent} />
            <HubStatCard theme={theme} label="Open offers" value={commissionStats.pendingDeals} accent={theme.accent} />
          </div>
        </PremiumSectionCard>
      </div>
    </HubLayout>
  );
}
