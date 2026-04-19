/**
 * Lead distribution + marketplace routing — recommendation-first; no black-box auto-routing in V1.
 */

import type { BrokerProfileRoutingHints } from "@/modules/broker/profile/broker-profile.types";
import type { GeoMatchType } from "@/modules/broker/distribution/broker-geo-match.service";
import type { BrokerRoutingAvailabilitySummary } from "@/modules/broker/availability/broker-availability.types";
import type { LeadLocation } from "@/modules/lead/lead-location.types";

export type BrokerLeadRoutingConfidenceLevel = "high" | "medium" | "low" | "insufficient";

/** Distribution candidate row — advisory only until admin confirms assignment. */
export type BrokerLeadRoutingCandidate = {
  brokerId: string;
  displayName: string;
  routingScore: number;
  confidenceLevel: BrokerLeadRoutingConfidenceLevel;
  reasons: string[];
  strengths: string[];
  risks: string[];
  /** Set when service-profile routing is enabled — explainable only. */
  profileHints?: BrokerProfileRoutingHints;
  /** Geo match vs declared service areas — advisory; never a hard exclude. */
  geoHints?: {
    matchType: GeoMatchType;
    geoScore: number;
    explanation: string;
  };
  /** Optional soft signals — availability / capacity / SLA merge when feature flags on. */
  routingAvailability?: BrokerRoutingAvailabilitySummary;
};

export type BrokerLeadDecisionMode = "manual" | "recommended" | "auto_internal_only";

/** Full advisory decision — mutable assignment state lives on Lead + timeline. */
export type BrokerLeadRoutingDecision = {
  leadId: string;
  selectedBrokerId?: string;
  candidateRows: BrokerLeadRoutingCandidate[];
  /** Primary mode for this snapshot — admin assignment overrides map to timeline + manual. */
  decisionMode: BrokerLeadDecisionMode;
  explanation: string;
  recommendedBrokerId?: string;
  routingNotes: string[];
  sparseDataNotes: string[];
  /** Brokers down-ranked or omitted from top-3 suggestion (explainable only). */
  suppressedBrokerIds?: string[];
  createdAt: string;
};

/** Normalized routing inputs for auditability — no invented expertise. */
export type BrokerLeadRoutingSignals = {
  leadType?: string | null;
  city?: string | null;
  area?: string | null;
  propertyType?: string | null;
  urgency: "low" | "medium" | "high";
  brokerPerformanceScore?: number | null;
  followUpHealth?: "good" | "moderate" | "poor" | null;
  brokerAvailability?: "open" | "busy" | "unknown" | null;
  recentLoad?: number | null;
  confidenceLevel: BrokerLeadRoutingConfidenceLevel;
  /** 0–1: how complete / trustworthy lead location extraction is (not broker match quality). */
  geoMatchScore?: number;
  /** Lead-side location resolution tier. */
  geoMatchType?: "resolved" | "partial" | "unknown";
  geoExplanation?: string | null;
  leadLocation?: LeadLocation | null;
};
