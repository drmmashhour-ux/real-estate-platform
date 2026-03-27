/**
 * Media validation — deterministic + placeholder hooks for future CV / street-view.
 * Limitations are surfaced honestly to admins; no claim of pixel-perfect exterior detection.
 */

export type PhotoCoverageResult = {
  photoCount: number;
  uniqueCount: number;
  duplicateUrlCount: number;
  exteriorSignalPresent: boolean;
  coverageScore: number; // 0–100
  limitations: string[];
};

export type DuplicateImageReport = {
  duplicateGroups: string[][];
  hashPlaceholderNote: string;
};

/** Heuristic: tags, description, or filename hints (placeholder — not computer vision). */
export function detectExteriorPhotoPresence(input: {
  photoUrls: string[];
  experienceTags?: unknown;
  description?: string | null;
}): boolean {
  const tags = Array.isArray(input.experienceTags)
    ? input.experienceTags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase())
    : [];
  const tagHit = tags.some((t) =>
    ["exterior", "outdoor", "patio", "garden", "balcony", "terrace", "deck", "facade"].some((k) => t.includes(k))
  );
  const desc = (input.description ?? "").toLowerCase();
  const descHit = ["balcony", "patio", "garden", "terrace", "exterior", "street view", "facade"].some((k) =>
    desc.includes(k)
  );
  const urlHit = input.photoUrls.some((u) =>
    /exterior|outside|facade|balcony|patio|garden/i.test(u)
  );
  return tagHit || descHit || urlHit;
}

export function detectDuplicateImages(photoUrls: string[]): DuplicateImageReport {
  const normalized = photoUrls.map((u) => u.split("?")[0]?.trim().toLowerCase() ?? "");
  const groups = new Map<string, string[]>();
  for (const u of photoUrls) {
    const key = u.split("?")[0]?.trim().toLowerCase() ?? u;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(u);
  }
  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  return {
    duplicateGroups,
    hashPlaceholderNote:
      "Perceptual hashing / CDN-normalized dedupe not enabled — URL-level dedupe only.",
  };
}

export function scorePhotoCoverage(input: {
  photoUrls: string[];
  experienceTags?: unknown;
  description?: string | null;
}): PhotoCoverageResult {
  const dup = detectDuplicateImages(input.photoUrls);
  const uniqueCount = new Set(input.photoUrls.map((u) => u.split("?")[0]?.trim().toLowerCase() ?? "")).size;
  const exteriorSignalPresent = detectExteriorPhotoPresence(input);
  let coverageScore = Math.min(100, uniqueCount * 14 + (exteriorSignalPresent ? 18 : 0));
  if (uniqueCount >= 8) coverageScore = Math.min(100, coverageScore + 8);
  const limitations = [
    "Coverage score uses counts and text/URL hints only — not image classification.",
  ];
  return {
    photoCount: input.photoUrls.length,
    uniqueCount,
    duplicateUrlCount: dup.duplicateGroups.reduce((s, g) => s + g.length - 1, 0),
    exteriorSignalPresent,
    coverageScore,
    limitations,
  };
}

/** Placeholder for future bedroom/bathroom/kitchen classifiers. */
export function classifyPhotoTypesPlaceholder(photoUrls: string[]): Record<string, number> {
  return {
    unclassified: photoUrls.length,
  };
}

export function generateMediaImprovementSuggestions(coverage: PhotoCoverageResult): string[] {
  const s: string[] = [];
  if (coverage.uniqueCount < 5) s.push("Add at least five distinct photos of the main living areas.");
  if (!coverage.exteriorSignalPresent) s.push("Add an exterior, balcony, patio, or building-context photo (or tag photos accordingly).");
  if (coverage.duplicateUrlCount > 0) s.push("Remove duplicate photo URLs so each image is unique.");
  s.push("Optional: add structured photo labels when the host dashboard supports it (future).");
  return s;
}
