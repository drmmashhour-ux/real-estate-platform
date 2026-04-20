/** Entity key for autonomy holdout lookup (matches `initializeExperiment` rows). */
export function holdoutEntityIdForAutonomyScope(scopeType: string, scopeId: string): string {
  return scopeType === "listing" ? scopeId : `portfolio:${scopeId}`;
}
