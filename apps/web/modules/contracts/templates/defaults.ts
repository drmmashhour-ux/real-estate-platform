import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import type {
  ContractTemplateDefinition,
  ContractTemplateRecord,
  TemplateSectionKey,
} from "./types";

const section = (
  id: string,
  key: TemplateSectionKey,
  title: string,
  sortOrder: number
) => ({ id, key, title, sortOrder });

function sellerAgreementDefinition(): ContractTemplateDefinition {
  return {
    sections: [
      section("s1", "identification", "Identification", 0),
      section("s2", "property", "Property", 1),
      section("s3", "price_conditions", "Price & conditions", 2),
      section("s4", "obligations", "Obligations", 3),
      section("s5", "declarations", "Declarations", 4),
      section("s6", "signatures", "Signatures", 5),
    ],
    fields: [
      {
        id: "f_party_name",
        sectionKey: "identification",
        key: "partyLegalName",
        label: "Seller legal name",
        fieldType: "text",
        required: true,
        sortOrder: 0,
      },
      {
        id: "f_property_address",
        sectionKey: "property",
        key: "propertyAddressSummary",
        label: "Property address (summary)",
        fieldType: "textarea",
        required: true,
        sortOrder: 0,
      },
      {
        id: "f_listing_accuracy",
        sectionKey: "declarations",
        key: "listingAccuracyAck",
        label: "I confirm listing details are accurate to the best of my knowledge",
        fieldType: "boolean",
        required: true,
        sortOrder: 0,
      },
    ],
    attachments: [{ type: "seller_declaration", required: true }],
  };
}

function hostAgreementDefinition(): ContractTemplateDefinition {
  return {
    sections: [
      section("h1", "identification", "Parties", 0),
      section("h2", "property", "Listing", 1),
      section("h3", "obligations", "Host obligations", 2),
      section("h4", "declarations", "Declarations", 3),
      section("h5", "signatures", "Signatures", 4),
    ],
    fields: [
      {
        id: "hf_host_ack",
        sectionKey: "declarations",
        key: "hostRulesAck",
        label: "I agree to host rules and applicable law",
        fieldType: "boolean",
        required: true,
        sortOrder: 0,
      },
    ],
    attachments: [{ type: "seller_declaration", required: true }],
  };
}

/** Default structured templates (used when DB has no row or as seed). */
export const DEFAULT_CONTRACT_TEMPLATES: ContractTemplateRecord[] = [
  {
    contractType: MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT,
    name: "Seller listing agreement (structured)",
    definition: sellerAgreementDefinition(),
  },
  {
    contractType: MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT,
    name: "BNHub host agreement (structured metadata)",
    definition: hostAgreementDefinition(),
  },
];

export function getDefaultTemplateForContractType(
  contractType: string
): ContractTemplateRecord | undefined {
  return DEFAULT_CONTRACT_TEMPLATES.find((t) => t.contractType === contractType);
}
