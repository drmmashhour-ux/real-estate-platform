import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";
import type { CompanyInsight } from "../company-insights/company-insights.types";
import type { BriefingSectionContent, WeeklyBriefingPayload } from "./executive-briefing.types";
import { founderIntelligenceDisclaimer } from "../founder-intelligence/founder-explainer";
import { labelEstimate, labelInference } from "../founder-intelligence/founder-explainer";

export function buildWeeklyBriefingPayload(
  snapshot: FounderIntelligenceSnapshot,
  insights: CompanyInsight[],
): WeeklyBriefingPayload {
  const m = snapshot.current;
  const range = m.range;

  const kpiSnapshot: BriefingSectionContent = {
    facts: [
      `Portée: ${m.scopeLabel}`,
      `Listings actifs résidentiels: ${m.listings.totalActiveResidential}`,
      `Nouvelles fiches (fenêtre): ${m.listings.newListingsInWindow}`,
      `Leads (fenêtre): ${m.leads.totalLeads} (qualifiés ${m.leads.qualifiedLeads})`,
      `Dossiers: actifs ${m.deals.active}, offres acceptées ${m.deals.acceptedOffers}, exécution ${m.deals.inExecution}, clos ${m.deals.closed}`,
      `Conformité: ouverts ${m.compliance.openCases}, ouverts période ${m.compliance.casesOpened}`,
      `Finance: volume commissions ${m.finance.totalCommissionVolumeCents} c., factures ${m.finance.invoiceTotalCents} c., payouts ${m.finance.brokerPayoutTotalCents} c., factures retard ${m.finance.overdueInvoices}`,
    ],
    inference: [
      labelInference(
        "Les tendances directionnelles sont détaillées dans les sections améliorations / dégradations (comparaison fenêtre précédente).",
      ),
    ],
    metrics: {
      active_deals: m.deals.active,
      closed_in_window: m.deals.closed,
      open_compliance: m.compliance.openCases,
    },
  };

  const improvements: BriefingSectionContent = {
    facts: snapshot.improving.map(
      (i) => `${i.metric}: ${i.previous ?? "n/a"} → ${i.current ?? "n/a"}`,
    ),
  };

  const deteriorations: BriefingSectionContent = {
    facts: snapshot.deteriorating.map(
      (i) => `${i.metric}: ${i.previous ?? "n/a"} → ${i.current ?? "n/a"}`,
    ),
  };

  const bottlenecks: BriefingSectionContent = {
    facts: m.rankings.bottlenecksByStage.map((b) => `${b.stage}: ${b.dealCount} dossier(s)`),
    recommendations: [
      "Inspecter qualitativement les dossiers à l’étape la plus chargée avant d’attribuer une cause externe.",
    ],
  };

  const complianceRisk: BriefingSectionContent = {
    facts: [
      `Cas conformité ouverts: ${m.compliance.openCases}`,
      `Cas ouverts sur la fenêtre: ${m.compliance.casesOpened}`,
    ],
  };

  const revenueBilling: BriefingSectionContent = {
    facts: [
      `Volume commissions (fenêtre): ${m.finance.totalCommissionVolumeCents} centimes`,
      `Factures bureau (fenêtre): ${m.finance.invoiceTotalCents} centimes`,
      `Payouts courtiers (fenêtre): ${m.finance.brokerPayoutTotalCents} centimes`,
      `Factures en retard (comptage statut): ${m.finance.overdueInvoices}`,
    ],
  };

  const brokerHighlights: BriefingSectionContent = {
    facts: m.rankings.topBrokers.slice(0, 5).map(
      (b) =>
        `${b.brokerName ?? b.brokerId}: ${b.closedDeals} clos, volume brut ${b.grossCommissionCents} c.`,
    ),
  };

  const listingMarketing: BriefingSectionContent = {
    facts: [
      m.listings.marketingEngagementAvg !== null
        ? `Engagement moyen (échantillon ${m.listings.engagementSampleSize}): ${m.listings.marketingEngagementAvg}`
        : "Engagement moyen non disponible (échantillon insuffisant ou absent).",
    ],
  };

  const dealsWatch: BriefingSectionContent = {
    facts: [
      `Demandes BLOCKED: ${m.blockers.blockedDealRequests}`,
      `Financement bloqué (signal interne): ${m.blockers.dealsStuckFinancing}`,
    ],
    inference: insights
      .filter((i) => i.insightType === "hypothesis_coordination")
      .map((i) => i.summary),
  };

  const risks: BriefingSectionContent = {
    facts: insights.slice(0, 8).map((i) => `${i.title}: ${i.summary}`),
  };

  const opportunities: BriefingSectionContent = {
    facts: snapshot.nextWeekWatchlist,
  };

  const founderActions: BriefingSectionContent = {
    facts: snapshot.decisionNow,
    recommendations: snapshot.delegateCandidates,
  };

  const executiveSummary: BriefingSectionContent = {
    facts: [
      `Période: ${range.startIso} → ${range.endIso} (${range.label}).`,
      snapshot.previous
        ? `Comparé à: ${snapshot.previous.range.startIso} → ${snapshot.previous.range.endIso}.`
        : "Comparaison période précédente non disponible.",
    ],
    inference: [
      labelInference(
        `Synthèse automatique à partir d’agrégats internes. ${founderIntelligenceDisclaimer}`,
      ),
    ],
    recommendations: [
      "Valider chaque section avec les équipes opérationnelles avant action publique ou engagement externe.",
    ],
  };

  const estimates: BriefingSectionContent = {
    facts: [],
    inference: [
      labelEstimate(
        "Aucune projection financière automatique dans ce briefing — utiliser l’outil de scénarios pour toute prévision chiffrée.",
      ),
    ],
  };

  return {
    weekRange: { start: range.startIso, end: range.endIso, label: range.label },
    executiveSummary,
    kpiSnapshot,
    improvements,
    deteriorations,
    bottlenecks,
    complianceRisk,
    revenueBilling,
    brokerHighlights,
    listingMarketing,
    dealsWatch,
    risks,
    opportunities,
    founderActions,
    estimates,
  };
}

export function sectionsFromPayload(
  payload: WeeklyBriefingPayload,
): { sectionKey: string; title: string; content: Record<string, unknown>; ordering: number }[] {
  const rows: { sectionKey: string; title: string; content: Record<string, unknown>; ordering: number }[] = [
    { sectionKey: "executive_summary", title: "Sommaire exécutif", content: { ...payload.executiveSummary }, ordering: 0 },
    { sectionKey: "kpi_snapshot", title: "Instantané KPI", content: { ...payload.kpiSnapshot }, ordering: 1 },
    { sectionKey: "improvements", title: "Ce qui s’améliore", content: { ...payload.improvements }, ordering: 2 },
    { sectionKey: "deteriorations", title: "Ce qui se dégrade", content: { ...payload.deteriorations }, ordering: 3 },
    { sectionKey: "bottlenecks", title: "Goulots d’exécution", content: { ...payload.bottlenecks }, ordering: 4 },
    { sectionKey: "compliance_risk", title: "Conformité / risque", content: { ...payload.complianceRisk }, ordering: 5 },
    { sectionKey: "revenue_billing", title: "Revenus / facturation / payouts", content: { ...payload.revenueBilling }, ordering: 6 },
    { sectionKey: "broker_highlights", title: "Courtiers (faits)", content: { ...payload.brokerHighlights }, ordering: 7 },
    { sectionKey: "listing_marketing", title: "Annonces / marketing", content: { ...payload.listingMarketing }, ordering: 8 },
    { sectionKey: "deals_watch", title: "Dossiers à surveiller", content: { ...payload.dealsWatch }, ordering: 9 },
    { sectionKey: "insights_risks", title: "Perspectives / risques (insights)", content: { ...payload.risks }, ordering: 10 },
    { sectionKey: "opportunities", title: "À surveiller la semaine prochaine", content: { ...payload.opportunities }, ordering: 11 },
    { sectionKey: "founder_actions", title: "Actions fondateur", content: { ...payload.founderActions }, ordering: 12 },
  ];
  if (payload.estimates) {
    rows.push({
      sectionKey: "estimates_optional",
      title: "Estimations / prévisions (optionnel)",
      content: { ...payload.estimates },
      ordering: 13,
    });
  }
  return rows;
}
