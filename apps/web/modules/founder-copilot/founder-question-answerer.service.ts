import type { CompanyInsight } from "../company-insights/company-insights.types";
import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";
import type { FounderCopilotAnswer, CopilotAnswerType } from "./founder-copilot.types";

function classifyQuestion(q: string): CopilotAnswerType {
  const s = q.toLowerCase();
  if (s.includes("bottleneck") || s.includes("goulot") || s.includes("blocage")) return "bottleneck";
  if (s.includes("clos") || s.includes("closing") || s.includes("fermer")) return "deals";
  if (s.includes("overload") || s.includes("surcharg") || s.includes("charge")) return "workload";
  if (s.includes("response") || s.includes("réponse") || s.includes("delai") || s.includes("délai")) return "response_time";
  if (s.includes("market") || s.includes("listing") || s.includes("marketing") || s.includes("annonce")) return "marketing";
  if (s.includes("conversion")) return "conversion";
  if (s.includes("revenue") || s.includes("revenu") || s.includes("fuite")) return "revenue";
  if (s.includes("today") || s.includes("aujourd") || s.includes("personnel")) return "review_today";
  if (s.includes("delegat") || s.includes("délégu")) return "delegation";
  return "generic";
}

export function answerFounderQuestion(
  question: string,
  snapshot: FounderIntelligenceSnapshot,
  insights: CompanyInsight[],
): FounderCopilotAnswer {
  const answerType = classifyQuestion(question);
  const m = snapshot.current;
  const evidence = (ref: string, value: string | number | null | undefined, nature: "fact" | "inference") => ({
    ref,
    value: value ?? null,
    nature,
  });

  if (answerType === "bottleneck") {
    const top = m.rankings.bottlenecksByStage[0];
    return {
      answerType,
      title: "Goulots d’exécution (comptage par étape)",
      summary: top
        ? `L’étape « ${top.stage} » regroupe le plus de dossiers actifs (${top.dealCount}) selon la ventilation interne.`
        : "Aucune ventilation par étape disponible dans cet agrégat.",
      evidence: [
        evidence("rankings.bottlenecksByStage", top ? top.dealCount : 0, "fact"),
        evidence("deals.active", m.deals.active, "fact"),
      ],
      recommendedActions: [
        { label: "Ouvrir la vue dossiers filtrée par étape indiquée pour validation qualitative.", nature: "review" },
      ],
      confidence: top ? 0.75 : 0.4,
      followupAreas: ["execution_pipeline"],
    };
  }

  if (answerType === "deals") {
    return {
      answerType,
      title: "Dossiers non clos — état agrégé",
      summary: `Dossiers actifs: ${m.deals.active}. En exécution: ${m.deals.inExecution}. Clos dans la fenêtre: ${m.deals.closed}.`,
      evidence: [
        evidence("deals.active", m.deals.active, "fact"),
        evidence("deals.inExecution", m.deals.inExecution, "fact"),
        evidence("deals.closed", m.deals.closed, "fact"),
      ],
      recommendedActions: [
        {
          label:
            "Pour le « pourquoi » par dossier, ouvrir le détail deal — non déduit automatiquement ici.",
          nature: "review",
        },
      ],
      confidence: 0.85,
      followupAreas: ["deal_detail"],
    };
  }

  if (answerType === "workload") {
    const broker = m.rankings.topBrokers[0];
    return {
      answerType,
      title: "Charge relative (clos + volume commission signalé)",
      summary: broker
        ? `Courtier en tête sur clos récents: ${broker.brokerName ?? broker.brokerId} (${broker.closedDeals} clos).`
        : "Pas de classement courtier dans cet agrégat.",
      evidence: broker
        ? [
            evidence("rankings.topBrokers.0.closedDeals", broker.closedDeals, "fact"),
            evidence("rankings.topBrokers.0.grossCommissionCents", broker.grossCommissionCents, "fact"),
          ]
        : [evidence("rankings.topBrokers", 0, "fact")],
      recommendedActions: [{ label: "Comparer avec tâches CRM par courtier avant réaffectation.", nature: "review" }],
      confidence: broker ? 0.65 : 0.35,
      followupAreas: ["broker_crm"],
    };
  }

  if (answerType === "response_time") {
    return {
      answerType,
      title: "Temps de réponse (échantillon interne)",
      summary:
        m.velocity.avgResponseTimeHours !== null
          ? `Moyenne ${m.velocity.avgResponseTimeHours} h (n=${m.velocity.responseSampleSize}).`
          : "Pas de moyenne calculée (échantillon insuffisant ou non disponible).",
      evidence: [
        evidence("velocity.avgResponseTimeHours", m.velocity.avgResponseTimeHours, "fact"),
        evidence("velocity.responseSampleSize", m.velocity.responseSampleSize, "fact"),
      ],
      recommendedActions: [{ label: "Inspecter les files communication CRM pour files en attente.", nature: "review" }],
      confidence: m.velocity.responseSampleSize > 3 ? 0.7 : 0.45,
      followupAreas: ["crm_communication"],
    };
  }

  if (answerType === "marketing") {
    return {
      answerType,
      title: "Performance annonces (signal agrégé)",
      summary:
        m.listings.marketingEngagementAvg !== null
          ? `Indice d’engagement moyen ${m.listings.marketingEngagementAvg} (échantillon ${m.listings.engagementSampleSize}).`
          : "Indice d’engagement non disponible.",
      evidence: [
        evidence("listings.marketingEngagementAvg", m.listings.marketingEngagementAvg, "fact"),
        evidence("listings.engagementSampleSize", m.listings.engagementSampleSize, "fact"),
      ],
      recommendedActions: [{ label: "Prioriser fiches à faible complétude avant campagnes payantes.", nature: "review" }],
      confidence: 0.55,
      followupAreas: ["listing_marketing"],
    };
  }

  if (answerType === "revenue") {
    return {
      answerType,
      title: "Signaux finance agrégés (pas de fuite déduite)",
      summary: `Commissions (volume brut période): ${m.finance.totalCommissionVolumeCents} centimes. Factures: ${m.finance.invoiceTotalCents}. Paiements courtiers: ${m.finance.brokerPayoutTotalCents}.`,
      evidence: [
        evidence("finance.totalCommissionVolumeCents", m.finance.totalCommissionVolumeCents, "fact"),
        evidence("finance.invoiceTotalCents", m.finance.invoiceTotalCents, "fact"),
        evidence("finance.brokerPayoutTotalCents", m.finance.brokerPayoutTotalCents, "fact"),
      ],
      recommendedActions: [
        {
          label: "Analyser écarts au niveau facture/payout dans l’outil finance bureau.",
          nature: "review",
        },
      ],
      confidence: 0.8,
      followupAreas: ["office_finance"],
    };
  }

  if (answerType === "review_today") {
    return {
      answerType,
      title: "Revue suggérée (priorités système)",
      summary: snapshot.decisionNow.length
        ? `Priorités: ${snapshot.decisionNow.slice(0, 5).join(" · ")}.`
        : "Aucune priorité système listée.",
      evidence: snapshot.decisionNow.map((t, i) => evidence(`decisionNow.${i}`, t, "fact")),
      recommendedActions: [{ label: "Traiter les alertes propriétaire dans l’ordre critique → info.", nature: "review" }],
      confidence: 0.6,
      followupAreas: ["owner_alerts"],
    };
  }

  if (answerType === "delegation") {
    return {
      answerType,
      title: "Délégation — files mesurables",
      summary:
        snapshot.delegateCandidates.join(" ") ||
        "Pas de file déléguable mise en avant par les agrégats courants.",
      evidence: [evidence("delegateCandidates.count", snapshot.delegateCandidates.length, "fact")],
      recommendedActions: [{ label: "Assigner via CRM interne en conservant traçabilité.", nature: "review" }],
      confidence: 0.5,
      followupAreas: ["delegation"],
    };
  }

  return {
    answerType: "generic",
    title: "Synthèse exécutive",
    summary: `Aperçu portée: ${m.scopeLabel}. Dossiers actifs ${m.deals.active}; conformité ouverte ${m.compliance.openCases}.`,
    evidence: [
      evidence("deals.active", m.deals.active, "fact"),
      evidence("compliance.openCases", m.compliance.openCases, "fact"),
      ...insights.slice(0, 2).map((i) => evidence(`insight.${i.insightType}`, i.title, "inference" as const)),
    ],
    recommendedActions: [{ label: "Affiner la question (blocage, finance, conformité, marketing).", nature: "review" }],
    confidence: 0.55,
    followupAreas: ["clarify_question"],
  };
}
