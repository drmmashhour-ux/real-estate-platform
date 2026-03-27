export const AutoDraftDocumentType = {
  SELLER_DECLARATION: "seller_declaration",
  BROKERAGE_FORM: "brokerage_form",
  PROMISE_PURCHASE_SUPPORT: "promise_purchase_support",
  INTERNAL_REVIEW_COMMENT: "internal_review_comment",
  FOLLOW_UP_REQUEST: "follow_up_request",
} as const;

export type AutoDraftDocumentTypeId = (typeof AutoDraftDocumentType)[keyof typeof AutoDraftDocumentType];
