/**
 * AI-powered storage analysis: recommendations from usage, large files, duplicates.
 * Used by /api/storage/ai and the Storage Dashboard.
 */

export type StorageAnalysisInput = {
  percent: number;
  largeFiles: number;
  duplicates: number;
  usedBytes?: number;
  limitBytes?: number;
  savingsPotentialBytes?: number;
};

export type StorageAnalysisResult = {
  recommendations: string[];
  warnings: string[];
};

export function analyzeStorage(data: StorageAnalysisInput): StorageAnalysisResult {
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (data.percent > 70) {
    recommendations.push("You are using most of your storage.");
    if (data.percent >= 90) warnings.push("Storage is almost full. Uploads may be blocked soon.");
  }

  if (data.percent > 90) {
    recommendations.push("Upgrade your plan to avoid interruptions.");
    warnings.push("Upgrade your plan to avoid interruptions.");
  }

  if (data.largeFiles > 0) {
    recommendations.push("Compress large images to save space.");
  }

  if (data.duplicates > 0) {
    recommendations.push("Remove duplicate files.");
  }

  if (data.percent >= 100) {
    warnings.push("Storage full — upgrade required.");
  }

  return { recommendations, warnings };
}

/**
 * Predict days until storage is full: remainingBytes / dailyUsage.
 * dailyUsage defaults to monthlyGrowth/30 if available, else a small constant.
 */
export function predictDaysLeft(
  usedBytes: number,
  limitBytes: number,
  dailyUsageBytes: number
): number | null {
  const remaining = limitBytes - usedBytes;
  if (remaining <= 0) return 0;
  if (dailyUsageBytes <= 0) return null;
  const days = remaining / dailyUsageBytes;
  return Math.max(0, Math.round(days));
}
