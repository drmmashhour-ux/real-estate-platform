import sharp from "sharp";

export type ImageQualityIssue =
  | "low_resolution"
  | "blurry"
  | "too_dark"
  | "too_bright"
  | "extreme_aspect_ratio";

export type ImageQualityTier = "reject" | "warn" | "good";

export type ImageQualityResult = {
  score: number;
  issues: ImageQualityIssue[];
};

/** Below this score uploads are rejected unless the client sends an explicit override. */
export const QUALITY_REJECT_BELOW = 40;

/** Below this score (but ≥ reject floor with override) we allow with warning. */
export const QUALITY_WARN_BELOW = 70;

export function tierForQualityScore(score: number): ImageQualityTier {
  if (score < QUALITY_REJECT_BELOW) return "reject";
  if (score < QUALITY_WARN_BELOW) return "warn";
  return "good";
}

/** Laplacian-style variance on a small luminance preview — higher ≈ sharper. */
async function laplacianVariance(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .rotate()
    .greyscale()
    .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  if (w < 3 || h < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap =
        -4 * data[i]! +
        data[i - 1]! +
        data[i + 1]! +
        data[i - w]! +
        data[i + w]!;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * Heuristic image quality score (0–100). No external services; safe for private uploads.
 */
export async function getImageQualityScore(buffer: Buffer): Promise<ImageQualityResult> {
  const issues: ImageQualityIssue[] = [];
  let score = 100;

  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (ratio < 0.35 || ratio > 3.5) {
      issues.push("extreme_aspect_ratio");
      score -= 22;
    }

    if (width < 800 || height < 600) {
      issues.push("low_resolution");
      score -= 28;
    }
  }

  const variance = await laplacianVariance(buffer);
  // Empirical band for phone JPEGs vs blurred shots (tunable).
  if (variance < 120) {
    issues.push("blurry");
    score -= 26;
  }

  const stats = await sharp(buffer).rotate().stats();
  const ch = stats.channels;
  let lum = 128;
  if (ch.length >= 3) {
    const r = ch[0]?.mean ?? 128;
    const g = ch[1]?.mean ?? 128;
    const b = ch[2]?.mean ?? 128;
    lum = 0.299 * r + 0.587 * g + 0.114 * b;
  } else {
    lum = ch[0]?.mean ?? 128;
  }

  if (lum < 42) {
    issues.push("too_dark");
    score -= 18;
  } else if (lum > 228) {
    issues.push("too_bright");
    score -= 14;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const deduped = Array.from(new Set(issues));
  return { score, issues: deduped };
}
