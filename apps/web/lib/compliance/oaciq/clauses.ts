/**
 * Generic platform-assistance clauses — apply until section-specific counsel-reviewed text is inserted in DB.
 * Does not replace OACIQ instruments or professional duties.
 *
 * Structured clause library + validation: `lib/compliance/oaciq/clause-compliance/` (feature `FEATURE_OACIQ_CLAUSE_COMPLIANCE_ENGINE_V1`).
 */

export const PLATFORM_ASSISTANCE_CLAUSE_FR =
  "Le présent module d'assistance vise à faciliter le respect des obligations professionnelles du courtier immobilier résidentiel inscrit à l'OACIQ. Il ne constitue ni un avis juridique ni un substitut aux documents officiels, aux formes prescrites ou à l'exercice du jugement professionnel du courtier. Toute décision, attestation, représentation auprès du client ou signature demeure la responsabilité exclusive du courtier, qui doit valider l'exactitude, l'exhaustivité et la pertinence des informations avant toute transmission. L'intelligence artificielle agit uniquement comme assistant documentaire et ne remplace pas l'analyse du courtier ni l'approbation finale manuelle.";

export const PLATFORM_ASSISTANCE_CLAUSE_EN =
  "This assistance module supports a residential broker’s professional obligations under OACIQ rules. It is not legal advice and does not replace official forms, prescribed formalities, or the broker’s professional judgment. Any decision, representation to a client, or signature remains solely the broker’s responsibility, who must verify accuracy, completeness, and relevance before transmission. AI acts only as a drafting assistant and does not replace broker analysis or final manual approval.";

/** Insert after counsel reviews the official OACIQ excerpt for the section. */
export const SECTION_CLAUSE_PENDING_FR =
  "[À compléter par le conseiller juridique — insérer ici les obligations précises découlant de l'extrait officiel OACIQ approuvé, en français, sans simplifier la portée normative.]";

export const SECTION_CLAUSE_PENDING_EN =
  "[Pending legal review — insert precise duties from the approved official OACIQ excerpt (English internal reference only).]";

/** Broker attestation — residential category; platform is not the licence holder. */
export const BROKER_LICENCE_ATTESTATION_CLAUSE_FR =
  "Le courtier déclare être titulaire d’un permis valide délivré par l’OACIQ et agir dans les limites de sa catégorie de permis, notamment en courtage immobilier résidentiel.";

export const BROKER_LICENCE_ATTESTATION_CLAUSE_EN =
  "The broker declares that he holds a valid licence issued by the OACIQ and is acting within the limits of his licence category, namely residential real estate brokerage.";
