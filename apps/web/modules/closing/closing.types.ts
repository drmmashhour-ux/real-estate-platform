export type ClosingRoomStatus = "PREPARING" | "READY" | "SIGNING" | "COMPLETED" | "FAILED";

export type ClosingDocumentStatus = "PENDING" | "READY" | "SIGNED" | "VERIFIED";

export type ClosingDocType = "FINAL_DEED" | "MORTGAGE" | "DISCLOSURE" | "TRANSFER" | "OTHER";

export type ChecklistItemStatus = "PENDING" | "DONE" | "BLOCKED";

export type ClosingValidationResult = {
  status: "READY" | "BLOCKED";
  issues: string[];
};
