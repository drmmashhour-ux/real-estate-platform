/**
 * Declared-profile confidence — observed signals stay read-only in `broker-observed-profile-signals.service`.
 */

import type { BrokerProfileConfidenceLevel, BrokerServiceProfileStored } from "./broker-profile.types";

export function buildProfileConfidenceAndMergeNotes(stored: BrokerServiceProfileStored): {
  profileConfidence: BrokerProfileConfidenceLevel;
  explanationNotes: string[];
} {
  const notes: string[] = [];
  let pts = 0;

  if (stored.serviceAreas.length >= 1) {
    pts += 1;
    notes.push("At least one declared service area.");
  }
  if (stored.serviceAreas.length >= 3) {
    pts += 1;
    notes.push("Multiple service areas declared — geographic routing has richer hints.");
  }

  const enabledSpecs = stored.specializations.filter((s) => s.enabled);
  if (enabledSpecs.length >= 1) {
    pts += 1;
    notes.push("Property specialization declared.");
  }
  if (stored.leadPreferences.length >= 1) {
    pts += 1;
    notes.push("Lead-type preferences declared.");
  }
  if (stored.languages.length >= 1) {
    pts += 1;
    notes.push("Languages declared.");
  }
  if (stored.capacity.maxActiveLeads != null || stored.capacity.preferredActiveRange != null) {
    pts += 1;
    notes.push("Capacity hints declared.");
  }
  if (stored.adminVerifiedAt) {
    pts += 2;
    notes.push("Admin verification timestamp present — prefer admin_verified specialization rows when set.");
  }

  let profileConfidence: BrokerProfileConfidenceLevel = "low";
  if (pts >= 6) profileConfidence = "high";
  else if (pts >= 3) profileConfidence = "medium";

  if (profileConfidence === "low") {
    notes.push("Sparse declared profile — routing uses neutral fallbacks and caps profile bonuses.");
  }

  return { profileConfidence, explanationNotes: notes.slice(0, 8) };
}
