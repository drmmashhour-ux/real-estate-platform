export function checkSourceCoverage(input: {
  sourceUsed: Array<{ field: string; sourceKey: string; reason: string }>;
  requiredFields: string[];
}) {
  const covered = new Set(input.sourceUsed.map((x) => x.field));
  const uncovered = input.requiredFields.filter((field) => !covered.has(field));
  return {
    sufficient: uncovered.length === 0,
    uncoveredFields: uncovered,
  };
}
