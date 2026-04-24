/** Fixed operational disclaimers — no legal-advice framing; private placement guardrails. */
export const LEGAL_DOC_ASSIST_DISCLAIMER_FR = `
<p><strong>Avis important :</strong> Ce document est généré à des fins opérationnelles et de coordination par LECIPM.
Il ne constitue pas un avis juridique, fiscal, comptable ou en valeurs mobilières. Un professionnel qualifié doit
examiner tout document avant signature ou diffusion. En cas d’écart, les formulaires et avis officiels (p. ex. OACIQ, AMF) prévalent.</p>
`;

export const LEGAL_DOC_ASSIST_DISCLAIMER_EN = `
<p><strong>Important:</strong> This document is produced for operational coordination by LECIPM only.
It is not legal, tax, accounting, or securities advice. A qualified professional must review any document before
it is signed or sent. Official publisher forms and regulatory instruments (e.g., OACIQ, AMF) prevail if there is any conflict.</p>
`;

export const INVESTOR_PRIVATE_PLACEMENT_GUARD_EN = `
<p><strong>Private placement context:</strong> These materials relate to a private, non-public offering context only.
They must not be construed as an offer to the public, a prospectus, or a solicitation of retail investors beyond applicable exemptions.
There is no guarantee of return or preservation of capital.</p>
`;

export const INVESTOR_PRIVATE_PLACEMENT_GUARD_FR = `
<p><strong>Contexte de placement privé :</strong> Ces documents visent uniquement un contexte de placement privé hors marché public.
Ils ne constituent pas un prospectus ni une offre au public. Aucun rendement ni protection du capital n’est garanti.</p>
`;

export function standardDisclaimerBlocks(): string {
  return `${LEGAL_DOC_ASSIST_DISCLAIMER_EN}${LEGAL_DOC_ASSIST_DISCLAIMER_FR}`;
}

export function investorGuardBlocks(): string {
  return `${INVESTOR_PRIVATE_PLACEMENT_GUARD_EN}${INVESTOR_PRIVATE_PLACEMENT_GUARD_FR}`;
}
