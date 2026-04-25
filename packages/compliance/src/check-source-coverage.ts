const DEFAULT_SKIP_FIELDS = new Set([
  "sourceExcerpts",
  "retrievedAt",
  "formType",
  "sourceUsed",
  "missingFields",
  "requiredReviewFields",
]);

/**
 * Every populated draft field must cite a `sourceUsed` attribution (no “silent” fills).
 */
export function checkSourceCoverage(input: {
  fields: Record<string, unknown>;
  sourceUsed: Array<{ field: string; sourceKey: string; reason: string }>;
  skipFields?: Set<string>;
}): {
  sufficient: boolean;
  uncoveredFields: string[];
} {
  const skip = input.skipFields ?? DEFAULT_SKIP_FIELDS;
  const supported = new Set(input.sourceUsed.map((x) => x.field));

  const populatedFields = Object.entries(input.fields)
    .filter(([key, value]) => !skip.has(key))
    .filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined &&
        value !== "REQUIRED_REVIEW",
    )
    .map(([key]) => key);

  const uncovered = populatedFields.filter((field) => !supported.has(field));

  return {
    sufficient: uncovered.length === 0,
    uncoveredFields: uncovered,
  };
}
