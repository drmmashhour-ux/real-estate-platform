export type KnowledgeFilter = {
  listingId?: string;
  city?: string;
  propertyType?: string;
  workspaceId?: string;
  userId?: string;
  memoryTypes?: string[];
  query?: string;
  limit?: number;
};

export type EvalItemInput = {
  inputPayload: Record<string, unknown>;
  expectedOutput?: Record<string, unknown> | null;
};
