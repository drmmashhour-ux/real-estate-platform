export enum LegalGraphNodeType {
  PROPERTY = "property",
  DOCUMENT = "document",
  DOCUMENT_SECTION = "document_section",
  FACT = "fact",
  USER = "user",
  REVIEW_ISSUE = "review_issue",
  SIGNATURE = "signature",
  WORKFLOW_STATE = "workflow_state",
}

export enum LegalGraphEdgeType {
  BELONGS_TO = "belongs_to",
  REFERENCES = "references",
  CONTRADICTS = "contradicts",
  SUPPORTS = "supports",
  REQUIRES = "requires",
  REVIEWED_BY = "reviewed_by",
  SIGNED_BY = "signed_by",
  SUPERSEDES = "supersedes",
  DERIVED_FROM = "derived_from",
}

export type FileHealth = "healthy" | "warning" | "blocked" | "critical";
