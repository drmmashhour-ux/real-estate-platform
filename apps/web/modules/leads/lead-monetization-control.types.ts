/**
 * Operator/admin monetization readout — advisory only; unifies quality, demand, and dynamic layers.
 */

import type { LeadQualityBand } from "@/modules/leads/lead-quality.types";

export type LeadMonetizationReasonType =
  | "quality"
  | "demand"
  | "broker_interest"
  | "region_peers"
  | "engagement"
  | "sparse_data"
  | "conservative_cap";

export type LeadMonetizationReason = {
  type: LeadMonetizationReasonType;
  label: string;
  description: string;
};

export type LeadMonetizationPriceSourceMode = "base_only" | "quality_advisory" | "dynamic_advisory";

export type LeadMonetizationConfidenceLevel = "low" | "medium" | "high";

export type LeadMonetizationControlSummary = {
  leadId: string;
  /** Revenue engine reference (`computeLeadValueAndPrice` — not modified here). */
  basePrice: number;
  qualityBand?: LeadQualityBand;
  qualityScore?: number;
  demandLevel?: "low" | "medium" | "high";
  demandScore?: number;
  brokerInterestLevel?: number;
  /** Unified advisory figure for display (never auto-applied). */
  suggestedPrice: number;
  priceSourceMode: LeadMonetizationPriceSourceMode;
  confidenceLevel: LeadMonetizationConfidenceLevel;
  reasons: LeadMonetizationReason[];
  warnings: string[];
  missingSignals: string[];
  /** Short operator-facing paragraph. */
  explanation: string;
};
