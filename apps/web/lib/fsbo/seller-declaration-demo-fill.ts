import {
  DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE,
  emptySellerDeclaration,
  newAdditionalDeclarationEntryId,
  syncSellerFullNameFromParties,
  type SectionAppliesState,
  type SellerDeclarationData,
  type StructuredPropertyAddress,
} from "@/lib/fsbo/seller-declaration-schema";
import { validateSellerDeclarationIntegrity } from "@/lib/fsbo/seller-declaration-validation";

/** Public URL used only so the identity “upload” field validates in QA (replace with a real upload in production). */
const DEMO_ID_DOCUMENT_PLACEHOLDER_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export type DemoRepresentationMode = "fsbo" | "broker";

export function isSellerDemoToolsEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SELLER_DEMO_TOOLS === "1") return true;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") return true;
  return false;
}

function allSectionsApply(): SectionAppliesState {
  const m: SectionAppliesState = {};
  for (const id of DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE) {
    m[id] = true;
  }
  return m;
}

function structuredAddressForPropertyType(
  propertyType: string,
  overrides: Partial<StructuredPropertyAddress>
): StructuredPropertyAddress {
  const pt = (propertyType || "SINGLE_FAMILY").toUpperCase();
  const isCondo = pt === "CONDO";
  const street =
    overrides.street?.trim() ||
    (isCondo ? "1100 Boulevard René-Lévesque O" : "4512 Rue Parthenais");
  const city = overrides.city?.trim() || "Montréal";
  const unit = overrides.unit !== undefined ? overrides.unit : isCondo ? "1204" : "";
  const postalCode = overrides.postalCode?.trim() || (isCondo ? "H3B 4W8" : "H2K 3T9");
  return { street, unit, city, postalCode };
}

/**
 * Fills every seller-declaration section with coherent demo content so you can exercise
 * validation, save, and submit flows. Does not upload real files — ID URL is a public placeholder PDF.
 *
 * @param representation — `fsbo` = private seller; `broker` = notes reference coordinated brokerage / DS path.
 */
export function buildDemoSellerDeclaration(
  propertyType: string,
  opts: {
    representation: DemoRepresentationMode;
    /** Prefer wizard `address` / `city` so declaration matches the listing. */
    address?: Partial<StructuredPropertyAddress>;
  }
): SellerDeclarationData {
  const pt = propertyType || "SINGLE_FAMILY";
  const upper = pt.toUpperCase();
  const isCondoType = upper === "CONDO";

  const identityNotes =
    opts.representation === "broker"
      ? "Representation: coordinated with a licensed OACIQ courtier; official DS/DSD and brokerage contract are maintained with the licensee. This platform checklist is an additional transparency summary for the listing file."
      : "Sole owner selling directly (FSBO path on this platform). No company, mandate, or third-party representative.";

  const pa = structuredAddressForPropertyType(pt, opts.address ?? {});

  const base = emptySellerDeclaration();
  const seller = base.sellers[0];
  if (!seller) throw new Error("emptySellerDeclaration must include one seller");

  const filled: SellerDeclarationData = {
    ...base,
    sectionApplies: allSectionsApply(),
    sellers: [
      {
        ...seller,
        idType: "DRIVERS_LICENSE",
        idNumber: "T12345678",
        fullName: "Alexandre Demo-Vendeur",
        dateOfBirth: "1985-06-15",
        occupation: "Software engineer",
        annualIncome: "95000",
        phone: "5145550100",
        email: "alexandre.demo.vendeur@example.com",
        sharedContact: false,
        idDocumentUrl: DEMO_ID_DOCUMENT_PLACEHOLDER_URL,
        idDocumentVerificationStatus: "none",
        idDetailsConfirmed: true,
        idAiCheck: null,
      },
    ],
    propertyAddressStructured: pa,
    sharedContactResponsibilityConfirmed: false,
    sellerFullName: "Alexandre Demo-Vendeur",
    authoritySellerIsCompany: false,
    authorityLawyerOrNotary: false,
    authorityMandateRepresentative: false,
    authoritySupplementalDocs: [],
    hasAuthorityToSell: false,
    identityNotes,
    sellingToFamilyMember: false,
    relatedToBuyer: false,
    conflictInterestDisclosureConfirmed: true,
    propertyDescriptionAccurate: true,
    propertyDescriptionNotes:
      "Description matches the current layout and finishes as viewed on recent visits. Demo disclosure text for QA.",
    includedItems: "Kitchen appliances, washer and dryer, window coverings, light fixtures as viewed.",
    excludedItems: "Seller’s portable safe, basement workbench, garden tools in shed.",
    knownDefects:
      "No latent defects known to the seller beyond normal wear; bathroom fan was replaced in 2022 (invoice on file).",
    pastIssues:
      "Minor roof repair after 2019 windstorm; insurance claim closed; no ongoing leaks reported since repair.",
    structuralConcerns: "None known; foundation visually sound; no engineer report ordered for this demo file.",
    renovationsDetail:
      "Kitchen refresh 2021 (cabinet paint, quartz counters); bathroom vanity 2022; no structural changes.",
    renovationInvoicesAvailable: false,
    poolExists: false,
    poolType: "",
    poolSafetyCompliance: "",
    buyerInspectionAccepted: true,
    isCondo: isCondoType,
    condoSyndicateDocumentsAvailable: isCondoType,
    condoFinancialStatementsAvailable: isCondoType,
    condoRulesReviewed: isCondoType,
    condoContingencyFundDetails: isCondoType
      ? "Contingency fund balance approximately $1.2M per last AGM; contributions stable year over year."
      : "",
    condoSpecialAssessmentDetails: isCondoType
      ? "No special assessment declared in the last 24 months per syndicate minutes available to seller."
      : "",
    condoCommonServicesNotes: isCondoType
      ? "Elevator, snow removal, and common hallway cleaning per condo bylaws; visitor parking via intercom."
      : "",
    isNewConstruction: false,
    gcrWarrantyDetails: "",
    builderNameContact: "",
    municipalSchoolTaxAcknowledged: true,
    cityTaxEstimateYearly: "$4,200 / year (estimate — verify on tax bill)",
    schoolTaxEstimateYearly: "$520 / year (estimate)",
    taxSupportingDocumentIds: [],
    gstQstMayApply: false,
    gstQstNotes: "",
    additionalDeclarationsText: "",
    additionalDeclarationsInsufficientKnowledge: false,
    additionalDeclarationsRelatedSectionKeys: [],
    additionalDeclarationsAttachedDocumentIds: [],
    additionalDeclarationsLegalAck: false,
    additionalDeclarationsHistory: [
      {
        id: newAdditionalDeclarationEntryId(),
        createdAt: new Date().toISOString(),
        text: "No additional latent issues beyond prior sections; ready for offer review and notary file preparation (demo entry).",
        insufficientKnowledge: false,
        relatedSectionKeys: [],
        attachedDocumentIds: [],
        legalAck: true,
      },
    ],
    informationCompleteAndAccurate: true,
    platformNotLawyerOrInspectorAck: true,
  };

  const synced = syncSellerFullNameFromParties(filled);
  const check = validateSellerDeclarationIntegrity(synced, pt);
  if (!check.ok) {
    // Surface in console during QA — form will still show field errors if anything drifts.
    if (typeof console !== "undefined" && isSellerDemoToolsEnabled()) {
      console.warn("[seller-declaration-demo-fill] Validation warnings:", check.errors, check.fieldErrors);
    }
  }
  return synced;
}

export type DemoListingBasics = {
  title: string;
  price: string;
  address: string;
  city: string;
  cadastreNumber: string;
  description: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  surfaceSqft: string;
  yearBuilt: string;
  annualTaxes: string;
  condoFees: string;
};

/** Prefills steps 1–2 of the seller listing wizard for faster end-to-end testing. */
export function buildDemoListingBasics(kind: "house" | "condo"): DemoListingBasics {
  if (kind === "condo") {
    return {
      title: "Demo — Condo QA (filled)",
      price: "489000",
      address: "1100 Boulevard René-Lévesque O",
      city: "Montréal",
      cadastreNumber: "2778123",
      description:
        "Bright corner unit for platform QA. Not a real listing. Good transit access; declaration and documents use demo placeholders.",
      propertyType: "CONDO",
      bedrooms: "2",
      bathrooms: "1",
      surfaceSqft: "980",
      yearBuilt: "2016",
      annualTaxes: "3200",
      condoFees: "385",
    };
  }
  return {
    title: "Demo — Single-family QA (filled)",
    price: "649000",
    address: "4512 Rue Parthenais",
    city: "Montréal",
    cadastreNumber: "1888345",
    description:
      "Detached home used for Seller Hub QA. Not a real listing. Yard and garage; finishes per photos once uploaded.",
    propertyType: "SINGLE_FAMILY",
    bedrooms: "3",
    bathrooms: "2",
    surfaceSqft: "1650",
    yearBuilt: "1998",
    annualTaxes: "4100",
    condoFees: "",
  };
}
