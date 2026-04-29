import "server-only";

export function runInternalDraftGeneration(input: {
  formType: string;
  facts: Record<string, unknown>;
  sources: unknown[];
  mode: "full" | "clause";
  clauseType?: string;
}): {
  fields: Record<string, unknown>;
  sourceUsed: string[];
  formType: string;
} {
  void input.sources;
  return {
    fields: {
      ...(input.facts ?? {}),
      _stub: true,
      _mode: input.mode,
    },
    sourceUsed: ["stub_source"],
    formType: input.formType,
  };
}
