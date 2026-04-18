export type ParsedDocumentStub = {
  dealDocumentId: string;
  fields: Record<string, unknown>;
  confidence: number;
};

export type DocDiffResult = {
  added: string[];
  removed: string[];
  changed: { key: string; before: unknown; after: unknown }[];
};
