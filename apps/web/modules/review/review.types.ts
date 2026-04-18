import type { DealDocumentVersionSource } from "@prisma/client";

export type ReviewDecision = "approved" | "rejected" | "needs_edit";

export type VersionSnapshot = {
  dealDocumentId: string;
  versionNumber: number;
  source: DealDocumentVersionSource;
  changesSummary: Record<string, unknown>;
  createdAt: string;
  createdById: string | null;
};

export type RedlineSummary = {
  fieldKeysTouched: string[];
  note: string;
};
