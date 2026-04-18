/** Map structured deltas for CP packaging — broker-reviewed only. */
export function buildConcessionDeltaSummary(input: {
  ppFields: Record<string, unknown>;
  cpFields: Record<string, unknown>;
}): { changedKeys: string[] } {
  const keys = new Set([...Object.keys(input.ppFields), ...Object.keys(input.cpFields)]);
  const changedKeys: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(input.ppFields[k]) !== JSON.stringify(input.cpFields[k])) {
      changedKeys.push(k);
    }
  }
  return { changedKeys };
}
