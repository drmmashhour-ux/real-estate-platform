/**
 * Template-based prefills only — no scraped or invented product data.
 */

import type { PlatformImprovementPriority } from "../platform-improvement.types";
import type { OpsAssistantPrefillData } from "./ops-assistant.types";

/** Deterministic placeholder lines built from priority fields (context), not external APIs. */
export function buildCtaPrefill(p: PlatformImprovementPriority): OpsAssistantPrefillData {
  const line =
    `[Draft CTA — review before publish]\nPrimary action: align with "${p.title.slice(0, 80)}".\nSuggested hook (localize region): Search properties across Syria instantly\nSupporting line: reduce friction noted in diagnostics: ${p.why.slice(0, 160)}`;
  return { text: line.trim(), label: "Primary CTA draft" };
}

export function buildTrustStripPrefill(p: PlatformImprovementPriority): OpsAssistantPrefillData {
  const line = `Verified listings • Direct contact • No hidden fees\n— ${p.category === "trust" ? "keep trust badges visible above the fold; adjust wording to your market." : "tune to the assurance you want guests and buyers to feel."}`;
  return { text: line, label: "Trust strip line (draft)" };
}

export function buildFeaturedListingHintPrefill(p: PlatformImprovementPriority): OpsAssistantPrefillData {
  return {
    text:
      "[Checklist]\n• Confirm eligibility rules with growth.\n• Avoid changing paid unlock / Stripe paths from this assistant.\n• Apply visibility only after manual review in admin.",
    label: "Featured placement checklist",
    configKeyHint: "FEATURE_* visibility flags — verify in Platform controls / docs before toggling.",
  };
}

export function buildOpsConsolidationPrefill(p: PlatformImprovementPriority): OpsAssistantPrefillData {
  const line = `Reduce duplicate dashboards: summarize operator narrative in one place.\nRelated priority context: ${p.why.slice(0, 200)}`;
  return { text: line.trim(), label: "Ops consolidation note" };
}
