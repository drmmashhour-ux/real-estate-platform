export type NegotiationTermsPayload = {
  priceCents: number;
  depositCents: number | null;
  financingTerms: Record<string, unknown>;
  commissionTerms: Record<string, unknown>;
  deadlines: Record<string, unknown>;
};

export type NegotiationClausePayload = {
  clauseType: string;
  text: string;
  /** Usually equals parent version number when carried forward; new clauses use current version number. */
  addedInVersion: number;
  removed?: boolean;
};

export type CreateOfferParams = {
  propertyId: string;
  caseId: string | null;
  createdBy: string;
  role: "buyer" | "seller" | "broker";
  terms: NegotiationTermsPayload;
  clauses: NegotiationClausePayload[];
};

export type CreateCounterOfferParams = {
  chainId: string;
  createdBy: string;
  role: "buyer" | "seller" | "broker";
  terms: NegotiationTermsPayload;
  clauses: NegotiationClausePayload[];
};

export type VersionDiffResult = {
  priceDeltaCents: number | null;
  depositChanged: boolean;
  depositDeltaCents: number | null;
  financingTermsChanged: boolean;
  commissionTermsChanged: boolean;
  deadlinesChanged: boolean;
  clauseChanges: Array<{
    kind: "added" | "removed" | "modified" | "unchanged";
    clauseType: string;
    detail?: string;
  }>;
};

/** Populated negotiation version (matches Prisma include terms + clauses). */
export type NegotiationVersionWithDetails = {
  id: string;
  chainId: string;
  versionNumber: number;
  parentVersionId: string | null;
  createdBy: string;
  role: "buyer" | "seller" | "broker";
  status: "pending" | "accepted" | "rejected";
  isFinal: boolean;
  createdAt: Date;
  terms: {
    priceCents: number;
    depositCents: number | null;
    financingTerms: unknown;
    commissionTerms: unknown;
    deadlines: unknown;
  } | null;
  clauses: Array<{
    id: string;
    clauseType: string;
    text: string;
    addedInVersion: number;
    removed: boolean;
  }>;
};
