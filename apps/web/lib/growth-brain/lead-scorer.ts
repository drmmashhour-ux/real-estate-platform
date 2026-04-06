import type { GrowthBrainSnapshot, GrowthLeadSummary, ScoredGrowthLead } from "./types";

/**
 * Supply-side lead scoring (owners, brokers, hosts) — heuristic, explainable, no fake stats.
 */
export function scoreGrowthLead(lead: GrowthLeadSummary, snapshot: GrowthBrainSnapshot): ScoredGrowthLead {
  let score = 40;
  const reasons: string[] = [];

  const cityDemand = snapshot.demandByCityCategory.find(
    (d) => d.city === (lead.city ?? "") && (d.category ?? "") === (lead.category ?? "")
  );
  const cityDemandLoose = snapshot.demandByCityCategory.find((d) => d.city === (lead.city ?? ""));

  if (cityDemand && cityDemand.trendScore >= 0.55) {
    score += 15;
    reasons.push("Segment trend score is elevated for this city/category.");
  } else if (cityDemandLoose && cityDemandLoose.trendScore >= 0.55) {
    score += 10;
    reasons.push("City-level demand signals are trending up.");
  }

  if (lead.permissionStatus === "granted" || lead.permissionStatus === "granted_by_source") {
    score += 12;
    reasons.push("Permission to contact is confirmed.");
  } else if (lead.permissionStatus === "requested") {
    score += 4;
    reasons.push("Permission status is requested — needs confirmation.");
  } else {
    score -= 8;
    reasons.push("Permission not confirmed — proceed carefully.");
  }

  if (lead.stage === "awaiting_assets" && (lead.permissionStatus === "granted" || lead.permissionStatus === "granted_by_source")) {
    score += 10;
    reasons.push("Awaiting assets with permission — high leverage if assets arrive.");
  }

  if (lead.stage === "interested") {
    score += 6;
    reasons.push("Stage indicates interest.");
  }

  if (lead.needsFollowUp) {
    score += 5;
    reasons.push("Follow-up flag is set — timely outreach matters.");
  }

  if (lead.role === "broker") {
    const brokerCity = snapshot.monetizationSignals.brokerHeavyCities.find((b) => b.city === lead.city);
    if (brokerCity && brokerCity.brokerLeadHint >= 2) {
      score += 6;
      reasons.push("Multiple broker-typed leads in this city — consider coordinated outreach.");
    }
  }

  if (lead.listingAcquisitionLeadId) {
    score += 4;
    reasons.push("Linked to listing acquisition pipeline.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: ScoredGrowthLead["tier"] = "cold";
  if (score >= 72) tier = "hot";
  else if (score >= 52) tier = "warm";

  let recommendedNextAction = "Review in CRM and send a personalized follow-up.";
  if (tier === "hot") {
    recommendedNextAction = "Prioritize manual follow-up and offer white-glove onboarding.";
  } else if (tier === "warm") {
    recommendedNextAction = "Send a concise checklist (photos, description) and propose a short call.";
  }

  return {
    leadId: lead.id,
    score,
    tier,
    reasons,
    recommendedNextAction,
  };
}
