export type SignatureCenterSectionKey = "deals" | "documents" | "investor" | "closing" | "financial";

export type SignatureCenterItemStatus = "pending_signature" | "signed" | "executed" | "rejected";

export type SignatureCenterRisk = "low" | "medium" | "high";

export type SignatureCenterUrgency = "normal" | "soon" | "urgent";

export type SignatureCenterItem = {
  itemKey: string;
  section: SignatureCenterSectionKey;
  actionType: string;
  summary: string;
  aiReasoning: string;
  financialImpactCad: number | null;
  dealValueCents: number | null;
  riskLevel: SignatureCenterRisk;
  complianceFlags: string[];
  status: SignatureCenterItemStatus;
  urgency: SignatureCenterUrgency;
  dealId: string;
  dealCode: string | null;
  createdAt: string;
  dueAt: string | null;
  /** Deep link for “edit before sign” / drill-down */
  editHref: string;
  previewHint: string;
  investorStructureSummary: string | null;
  pricingSummary: string | null;
  metadata: Record<string, unknown>;
};

export type SignatureCenterNotification = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
};

export type SignatureCenterSnapshot = {
  generatedAt: string;
  items: SignatureCenterItem[];
  notifications: SignatureCenterNotification[];
  disclaimer: string;
};
