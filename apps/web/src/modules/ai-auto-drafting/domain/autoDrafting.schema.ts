import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import type { AutoDraftTemplateSchema } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";

/** Maps seller declaration sections into auto-draft schema (template-first). */
function fromSellerDeclaration(): AutoDraftTemplateSchema {
  const sections = getSellerDeclarationSections();
  return {
    id: "seller_declaration_v1",
    label: "Seller declaration",
    documentType: AutoDraftDocumentType.SELLER_DECLARATION,
    sections: sections.map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      fields: s.fields.map((f) => ({
        key: f.key,
        label: f.label,
        required: f.required,
        inputTypes: [f.inputType === "date" ? "text" : f.inputType],
        conditional: f.conditional,
        aiDraftingEnabled: f.aiAssistAllowed !== false,
      })),
    })),
  };
}

const brokerageEngagementStub: AutoDraftTemplateSchema = {
  id: "brokerage_engagement_v1",
  label: "Brokerage engagement (stub)",
  documentType: AutoDraftDocumentType.BROKERAGE_FORM,
  sections: [
    {
      key: "parties_scope",
      label: "Parties & scope",
      description: "Identify parties and mandate scope.",
      fields: [
        { key: "broker_name", label: "Broker name", required: true, inputTypes: ["text"], aiDraftingEnabled: true },
        { key: "client_name", label: "Client name", required: true, inputTypes: ["text"], aiDraftingEnabled: true },
        { key: "territory", label: "Territory", required: false, inputTypes: ["text"], aiDraftingEnabled: true },
      ],
    },
  ],
};

const internalReviewComment: AutoDraftTemplateSchema = {
  id: "internal_review_comment_v1",
  label: "Internal review comment",
  documentType: AutoDraftDocumentType.INTERNAL_REVIEW_COMMENT,
  sections: [
    {
      key: "comment",
      label: "Reviewer comment",
      description: "Neutral internal notes for reviewers.",
      fields: [{ key: "comment_body", label: "Comment", required: true, inputTypes: ["textarea"], aiDraftingEnabled: true }],
    },
  ],
};

export const autoDraftTemplates: AutoDraftTemplateSchema[] = [
  fromSellerDeclaration(),
  brokerageEngagementStub,
  internalReviewComment,
];

export function listAutoDraftTemplates(): AutoDraftTemplateSchema[] {
  return autoDraftTemplates;
}
