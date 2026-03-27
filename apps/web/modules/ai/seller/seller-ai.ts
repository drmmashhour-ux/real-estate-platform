import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildSellerAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("seller", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "listing_description":
      return {
        system:
          system +
          " Generate a polished listing description from structured fields. Do not invent square footage or legal facts not provided.",
        user: `Task: Listing description draft.\nContext:\n${userJson}`,
      };
    case "pricing_guidance":
      return {
        system:
          system +
          " Give positioning guidance as an estimate only; cite uncertainty; no guaranteed sale price.",
        user: `Task: Pricing positioning (estimate).\nContext:\n${userJson}`,
      };
    case "declaration_help":
      return {
        system:
          system +
          " Explain declaration sections plainly; give generic disclosure examples; not legal advice.",
        user: `Task: Seller declaration help.\nContext:\n${userJson}`,
      };
    case "completeness":
      return {
        system:
          system +
          " List likely missing documents, disclosures, or weak marketing fields based on context.",
        user: `Task: Completeness check.\nContext:\n${userJson}`,
      };
    case "publish_readiness":
      return {
        system:
          system +
          " Produce a short readiness summary: ready / missing / warnings. User must still pass platform gates.",
        user: `Task: Publish readiness summary.\nContext:\n${userJson}`,
      };
    case "legal_form_explain":
      return {
        system:
          system +
          " Explain a form section, suggest clearer wording or missing items; AI does not approve legally.",
        user: `Task: Legal/form section drafting assistant.\nContext:\n${userJson}`,
      };
    case "content_license_explain":
      return {
        system:
          system +
          " Explain ONE section of a platform Content & Usage License in plain language: what it means in real life, one concrete example, and what users should watch for. Never say you are a lawyer. Keep under 180 words.",
        user: `Task: Plain-language license section explainer.\nContext:\n${userJson}`,
      };
    case "legal_action_risk":
      return {
        system:
          system +
          " Given an upcoming user action (publish listing, upload photos, booking, broker request), say IF it may conflict with typical content-usage rules and WHY in 2-4 short sentences. If low risk, say so. Never instruct to break rules. Not legal advice.",
        user: `Task: Pre-action content-license risk hint.\nContext:\n${userJson}`,
      };
    case "legal_readiness_score":
      return {
        system:
          system +
          " Score legal/marketing readiness 0-100 for a listing draft: missing disclosures, unclear ownership cues, thin description, few photos. Return: score, 3-5 bullet flags, 3 recommended fixes. Not legal advice.",
        user: `Task: Seller/host listing legal readiness.\nContext:\n${userJson}`,
      };
    case "contract_plain_explain":
      return {
        system:
          system +
          " Summarize key obligations, notable risks, and practical consequences (e.g. late cancellation) for an in-app acknowledgment form. Not legal advice; user should consult counsel for binding decisions.",
        user: `Task: Plain contract/acknowledgment explainer.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function sellerOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "listing_description":
      return "Offline mode: Lead with location + property type, highlight unique features, mention recent updates with dates if known, and end with a clear viewing/contact CTA.";
    case "pricing_guidance":
      return "Offline mode: Compare to recent nearby sales when available; adjust for condition; treat any number as a non-binding estimate.";
    case "declaration_help":
      return "Offline mode: Disclose material defects you know of; when unsure, say so and seek professional guidance.";
    case "completeness":
      return "Offline mode: Check photos, floor plan, taxes, inclusions/exclusions, and required documents per the listing checklist.";
    case "publish_readiness":
      return "Offline mode: Verify documents uploaded, contracts signed where required, and pricing accuracy before publishing.";
    case "legal_form_explain":
      return "Offline mode: Read each section slowly; for binding terms use qualified counsel — AI cannot approve contracts.";
    case "content_license_explain":
      return "Offline mode: This section limits how listing text and photos may be reused outside the platform. In practice, keep marketing on-platform unless you have explicit permission to republish elsewhere.";
    case "legal_action_risk":
      return "Offline mode: Publishing or sharing content off-platform without rights can create compliance issues — double-check you own or have permission for all photos and descriptions.";
    case "legal_readiness_score":
      return "Offline readiness (estimate): add more photos, a clear title and location, and disclose material facts you know of. Target 85+ before going live; verify details with a professional.";
    case "contract_plain_explain":
      return "Offline mode: Confirm you understand fees, cancellation windows, and any penalties shown in the form before accepting.";
    default:
      return "Offline AI: complete seller checklist and verification steps in the hub.";
  }
}
