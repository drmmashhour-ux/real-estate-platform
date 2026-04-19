/**
 * Deterministic profile bonuses for lead routing — capped so performance + fairness stay primary.
 */

import type {
  BrokerLeadPreferenceType,
  BrokerProfileConfidenceLevel,
  BrokerProfileRoutingHints,
  BrokerServiceProfileStored,
} from "./broker-profile.types";
import type { BrokerObservedProfileSignals } from "./broker-observed-profile-signals.service";

/** Hard cap on points profile matching can add to routing score (after confidence scaling). */
export const PROFILE_ROUTING_SCORE_DELTA_CAP = 8;

/** Raw sub-scores summed before scaling — prevents one dimension monopolizing. */
const PROFILE_RAW_SUM_CAP = 14;

const CONF_WEIGHT: Record<BrokerProfileConfidenceLevel, number> = {
  high: 1,
  medium: 0.82,
  low: 0.62,
};

export type LeadRoutingProfileContext = {
  city: string | null;
  area: string | null;
  propertyTypeBucket: import("./broker-profile.types").BrokerSpecializationPropertyType | null;
  intentCategory: BrokerLeadPreferenceType | null;
  leadLocale: string | null;
};

export function inferLeadIntentCategory(leadType: string | null, message: string): BrokerLeadPreferenceType | null {
  const m = `${leadType ?? ""} ${message}`.toLowerCase();
  if (m.includes("rent") && !m.includes("invest")) return "renter";
  if (m.includes("seller") || m.includes("sell my") || m.includes("list my home")) return "seller";
  if (m.includes("invest")) return "investor";
  if (m.includes("host") || m.includes("bnb") || m.includes("short-term stay")) return "host";
  if (m.includes("consult") || m.includes("evaluation") || m.includes("evaluate")) return "consultation";
  const lt = (leadType ?? "").toLowerCase();
  if (lt.includes("buy") || m.includes("purchase") || m.includes("buying")) return "buyer";
  return null;
}

export function inferPropertyBucketFromLead(propertyType: string | null): import("./broker-profile.types").BrokerSpecializationPropertyType | null {
  if (!propertyType?.trim()) return null;
  const x = propertyType.toLowerCase();
  if (x.includes("condo")) return "condo";
  if (x.includes("commercial") || x.includes("office")) return "commercial";
  if (x.includes("land")) return "land";
  if (x.includes("luxury")) return "luxury";
  if (x.includes("rent")) return "rental";
  if (x.includes("invest")) return "investor";
  if (x.includes("bnb") || x.includes("stay")) return "bnhub";
  return "residential";
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function cityHitsLead(
  leadCity: string | null,
  leadArea: string | null,
  brokerCity: string,
  brokerArea: string | null,
): boolean {
  const lc = leadCity ? norm(leadCity) : "";
  const la = leadArea ? norm(leadArea) : "";
  const bc = norm(brokerCity);
  const ba = brokerArea ? norm(brokerArea) : "";
  if (lc && (bc.includes(lc) || lc.includes(bc))) return true;
  if (la && (bc.includes(la) || la.includes(bc))) return true;
  if (lc && ba && (ba.includes(lc) || lc.includes(ba))) return true;
  return false;
}

export function computeProfileRoutingBonus(input: {
  declared: BrokerServiceProfileStored | null;
  observed: BrokerObservedProfileSignals | null;
  leadCtx: LeadRoutingProfileContext;
  profileConfidence: BrokerProfileConfidenceLevel;
  activeLeadCount: number;
}): { delta: number; hints: BrokerProfileRoutingHints; reasons: string[] } {
  const hints: BrokerProfileRoutingHints = {};
  const reasons: string[] = [];
  let raw = 0;

  const declared = input.declared;

  if (declared && !declared.capacity.acceptingNewLeads) {
    raw -= 4;
    hints.capacityNote = "Marked not accepting new leads";
    reasons.push("Capacity: broker marked not accepting new leads — routing score tempered.");
  }

  if (
    declared?.capacity.acceptingNewLeads &&
    input.activeLeadCount <= 14 &&
    (declared.capacity.maxActiveLeads == null || input.activeLeadCount <= declared.capacity.maxActiveLeads)
  ) {
    raw += 1;
    hints.capacityAvailabilityFit = true;
    reasons.push("Accepting new leads with lighter active load (capacity hint vs snapshot).");
  }

  if (declared?.capacity.maxActiveLeads != null && input.activeLeadCount > declared.capacity.maxActiveLeads) {
    raw -= 3;
    hints.capacityNote = hints.capacityNote ?? "Over stated max active leads";
    reasons.push(
      `Capacity: active CRM volume (${input.activeLeadCount}) exceeds broker max hint (${declared.capacity.maxActiveLeads}).`,
    );
  }

  if (declared?.serviceAreas?.length) {
    let best = 0;
    let label = "";
    for (const a of declared.serviceAreas) {
      if (!cityHitsLead(input.leadCtx.city, input.leadCtx.area, a.city, a.area ?? null)) continue;
      const pts = a.priorityLevel === "primary" ? 5 : a.priorityLevel === "secondary" ? 4 : 3;
      if (pts > best) {
        best = pts;
        label = `${a.city}${a.area ? ` (${a.area})` : ""} · ${a.priorityLevel}`;
      }
    }
    if (best > 0) {
      raw += Math.min(best, 5);
      hints.serviceAreaMatch = label;
      reasons.push(`Primary service area match — ${label}.`);
    }
  }

  if (declared?.specializations?.length && input.leadCtx.propertyTypeBucket) {
    const match = declared.specializations.find((s) => s.enabled && s.propertyType === input.leadCtx.propertyTypeBucket);
    if (match) {
      const m =
        match.confidenceSource === "admin_verified" ? 4 : match.confidenceSource === "self_declared" ? 3 : 2;
      raw += m;
      hints.specializationMatch = `${match.propertyType} (${match.confidenceSource})`;
      reasons.push(`Specialization alignment — ${match.propertyType} (${match.confidenceSource}).`);
    }
  }

  if (declared?.leadPreferences?.length && input.leadCtx.intentCategory) {
    const pref = declared.leadPreferences.find((p) => p.leadType === input.leadCtx.intentCategory);
    if (pref) {
      const adj = pref.priorityLevel === "preferred" ? 3 : pref.priorityLevel === "standard" ? 1 : -3;
      raw += adj;
      reasons.push(`Lead-type preference (${pref.leadType} → ${pref.priorityLevel}).`);
    }
  }

  if (declared?.languages?.length && input.leadCtx.leadLocale) {
    const loc = input.leadCtx.leadLocale.toLowerCase().slice(0, 2);
    const hit = declared.languages.some((l) => l.code.toLowerCase().startsWith(loc));
    if (hit) {
      raw += 2;
      hints.languageMatch = true;
      reasons.push(`Language overlap — lead locale ${input.leadCtx.leadLocale}.`);
    }
  }

  if (
    (!declared?.serviceAreas?.length || raw < 3) &&
    input.observed &&
    input.leadCtx.city &&
    input.observed.observedServiceAreas.some((x) => norm(x.city) === norm(input.leadCtx.city!) && x.leadCount >= 3)
  ) {
    raw += 2;
    hints.observedSupportNote = `Observed CRM touches in ${input.leadCtx.city} (historical; not auto-verified expertise).`;
    reasons.push("Observed activity in this city in CRM sample — advisory support only.");
  }

  raw = Math.min(PROFILE_RAW_SUM_CAP, raw);

  const w = CONF_WEIGHT[input.profileConfidence];
  hints.profileConfidenceNote =
    input.profileConfidence === "low"
      ? "Declared profile sparse — profile bonuses scaled down."
      : input.profileConfidence === "medium"
        ? "Moderate declared profile completeness."
        : "Rich declared profile — higher trust in explicit routing hints.";

  let delta = Math.round(raw * w);
  delta = Math.max(-PROFILE_ROUTING_SCORE_DELTA_CAP, Math.min(PROFILE_ROUTING_SCORE_DELTA_CAP, delta));

  return { delta, hints, reasons };
}
