import type { LecipmLegalDocumentTemplateKind } from "@prisma/client";
import { investorGuardBlocks, standardDisclaimerBlocks } from "./legal-documents.disclaimers";

const HDR = (title: string) => `<h1>${title}</h1><p><em>Version assistive — révision professionnelle requise / professional review required.</em></p>`;

/** Default editable HTML bodies (placeholders {{dot.path}}). */
export const DEFAULT_TEMPLATE_BODIES: Record<LecipmLegalDocumentTemplateKind, { name: string; bodyHtml: string }> = {
  PROMISE_TO_PURCHASE: {
    name: "Promesse d’achat (ébauche opérationnelle)",
    bodyHtml: `${HDR("Promise to Purchase — operational draft")}
${standardDisclaimerBlocks()}
<p><strong>Deal:</strong> {{deal.dealCode}} · <strong>Status:</strong> {{deal.status}} · <strong>Price (cents):</strong> {{deal.priceCents}}</p>
<p><strong>Property:</strong> {{listing.title}} ({{listing.listingCode}}) — {{listing.addressSummary}}</p>
<p><strong>Buyer:</strong> {{buyer.name}} &lt;{{buyer.email}}&gt;</p>
<p><strong>Seller:</strong> {{seller.name}} &lt;{{seller.email}}&gt;</p>
<p><strong>Broker of record (snapshot):</strong> {{broker.displayName}} — licence {{broker.licenceNumber}} — {{broker.regulator}}</p>
<p><strong>Conditions / notes (snapshot):</strong> {{deal.conditionsSummary}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  COUNTER_PROPOSAL: {
    name: "Contre-proposition (ébauche)",
    bodyHtml: `${HDR("Counter-proposal — operational draft")}
${standardDisclaimerBlocks()}
<p><strong>Deal:</strong> {{deal.dealCode}}</p>
<p><strong>Property:</strong> {{listing.title}}</p>
<p><strong>Counter context:</strong> {{negotiation.counterSummary}}</p>
<p><strong>Broker:</strong> {{broker.displayName}} ({{broker.licenceNumber}})</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  AMENDMENT: {
    name: "Avenant (ébauche)",
    bodyHtml: `${HDR("Amendment — operational draft")}
${standardDisclaimerBlocks()}
<p><strong>Deal:</strong> {{deal.dealCode}}</p>
<p><strong>Amendment summary:</strong> {{amendment.summary}}</p>
<p><strong>Parties acknowledged snapshot:</strong> {{amendment.partiesAck}}</p>
<p><strong>Broker:</strong> {{broker.displayName}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  BROKER_DISCLOSURE: {
    name: "Divulgation de courtier",
    bodyHtml: `${HDR("Broker disclosure block")}
${standardDisclaimerBlocks()}
<p><strong>Broker:</strong> {{broker.displayName}} — {{broker.licenceNumber}}</p>
<p><strong>Agency relationship:</strong> {{disclosure.agencyRelationship}}</p>
<p><strong>Remuneration summary:</strong> {{disclosure.remunerationSummary}}</p>
<p><strong>Material facts known:</strong> {{disclosure.materialFactsSummary}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  CONFLICT_DISCLOSURE: {
    name: "Divulgation de conflit",
    bodyHtml: `${HDR("Conflict of interest disclosure")}
${standardDisclaimerBlocks()}
<p><strong>Broker:</strong> {{broker.displayName}}</p>
<p><strong>Conflict summary:</strong> {{conflict.summary}}</p>
<p><strong>Mitigation:</strong> {{conflict.mitigation}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  SUBSCRIPTION_AGREEMENT: {
    name: "Convention de souscription (privé — ébauche)",
    bodyHtml: `${HDR("Subscription agreement — private placement draft")}
${standardDisclaimerBlocks()}
${investorGuardBlocks()}
<p><strong>Issuer / SPV:</strong> {{issuer.name}}</p>
<p><strong>Offering:</strong> {{capital.title}} ({{capital.solicitationMode}})</p>
<p><strong>Investor name (placeholder):</strong> {{investor.legalName}}</p>
<p><strong>Use of proceeds (snapshot):</strong> {{offering.useOfProceeds}}</p>
<p><strong>Capital structure (snapshot):</strong> {{offering.capitalStructure}}</p>
<p><strong>No guarantee:</strong> {{offering.noGuaranteeLine}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  INVESTOR_MEMO: {
    name: "Note à l’investisseur",
    bodyHtml: `${HDR("Investor memorandum — informational")}
${standardDisclaimerBlocks()}
${investorGuardBlocks()}
<p><strong>Deal summary:</strong> {{packet.summary}}</p>
<p><strong>Risks (snapshot):</strong> {{packet.risks}}</p>
<p><strong>ESG / retrofit (if any):</strong> {{esg.snapshot}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  RISK_DISCLOSURE: {
    name: "Divulgation des risques",
    bodyHtml: `${HDR("Risk disclosure")}
${standardDisclaimerBlocks()}
${investorGuardBlocks()}
<p><strong>Major risks:</strong> {{packet.risks}}</p>
<p><strong>Liquidity / hold:</strong> {{risks.liquidity}}</p>
<p><strong>Concentration:</strong> {{risks.concentration}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  EXEMPTION_REPRESENTATION: {
    name: "Représentations d’exemption",
    bodyHtml: `${HDR("Exemption representation — template")}
${standardDisclaimerBlocks()}
${investorGuardBlocks()}
<p><strong>Investor representations (checklist snapshot):</strong> {{exemption.representationChecklist}}</p>
<p><strong>Issuer narrative (non-legal):</strong> {{capital.exemptionNarrative}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  INVESTOR_QUESTIONNAIRE: {
    name: "Questionnaire investisseur",
    bodyHtml: `${HDR("Investor suitability questionnaire — draft")}
${standardDisclaimerBlocks()}
${investorGuardBlocks()}
<p><strong>Questions (JSON snapshot):</strong> {{questionnaire.items}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
  DEAL_INVESTOR_HANDOFF_PACKET: {
    name: "Dossier de passation interne deal → investissement",
    bodyHtml: `${HDR("Internal deal → investor handoff packet")}
${standardDisclaimerBlocks()}
<p><em>Internal / supporting — not for public distribution unless converted through investment-domain workflow.</em></p>
<p><strong>Deal:</strong> {{handoff.dealCode}} · {{handoff.dealSummary}}</p>
<p><strong>Committee / score snapshot:</strong> {{handoff.underwriting}}</p>
<p><strong>Diligence highlights:</strong> {{handoff.diligence}}</p>
<p><strong>Compliance blockers:</strong> {{handoff.complianceBlockers}}</p>
<p><strong>ESG / retrofit:</strong> {{handoff.esg}}</p>
<p><strong>Notary / closing posture:</strong> {{handoff.closingPosture}}</p>
<p><strong>Capital context (if linked):</strong> {{handoff.capitalContext}}</p>
<p><strong>Prepared at:</strong> {{meta.generatedAt}}</p>`,
  },
};
