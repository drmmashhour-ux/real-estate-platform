import sharp from "sharp";

export type PhotoScoreMetadata = {
  width: number;
  height: number;
};

async function laplacianVariance(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
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

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export type PhotoScoreOptions = {
  listingKind?: "stay" | "sale";
};

export type PhotoScoreResult = {
  score: number;
  reasons: string[];
};

/**
 * Composite cover suitability score (0–100) — runs locally on buffers only.
 */
export async function scorePhoto(
  buffer: Buffer,
  metadata?: Partial<PhotoScoreMetadata>,
  opts?: PhotoScoreOptions,
): Promise<PhotoScoreResult> {
  const reasons: string[] = [];

  const meta = metadata?.width && metadata?.height ? metadata : await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Resolution (30)
  const shortSide = Math.min(width, height) || 1;
  const resRaw = clamp01((shortSide - 480) / (1600 - 480));
  const resolution = resRaw * 100;
  if (shortSide < 800) reasons.push("moderate_resolution");
  else reasons.push("good_resolution");

  // Sharpness proxy (25)
  const lv = await laplacianVariance(buffer);
  const sharpness = clamp01((lv - 80) / 800) * 100;
  if (lv < 120) reasons.push("soft_focus_or_motion");
  else reasons.push("reasonable_sharpness");

  // Brightness balance (15)
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
  const dist = Math.abs(lum - 128);
  const brightness = clamp01(1 - dist / 90) * 100;
  if (lum < 45 || lum > 235) reasons.push("brightness_extreme");
  else reasons.push("balanced_exposure");

  // Aspect (10)
  const ratio = width > 0 && height > 0 ? width / height : 1;
  const aspectScore =
    ratio >= 0.72 && ratio <= 1.55 ? 100 : clamp01(1 - Math.abs(Math.log(ratio)) / 1.8) * 100;
  if (ratio < 0.55 || ratio > 1.85) reasons.push("unusual_aspect_ratio");

  // Saliency proxy via entropy (20)
  let entropyAvg = 3;
  if (ch.length > 0) {
    const ents = ch.map((c) => c.entropy ?? 0).filter((n) => Number.isFinite(n));
    entropyAvg = ents.length ? ents.reduce((a, b) => a + b, 0) / ents.length : 3;
  }
  const saliency = clamp01((entropyAvg - 2) / 5) * 100;

  let composite =
    resolution * 0.3 +
    sharpness * 0.25 +
    brightness * 0.15 +
    aspectScore * 0.1 +
    saliency * 0.2;

  if (opts?.listingKind === "stay" && width > height + 32) {
    composite = Math.min(100, composite + 5);
    reasons.push("landscape_bias_stay");
  }

  const score = Math.max(0, Math.min(100, Math.round(composite)));
  return { score, reasons: Array.from(new Set(reasons)).slice(0, 8) };
}
