import sharp from "sharp";

/** Hard limit before decoding (server-side safety). */
export const IMAGE_PROCESS_MAX_BYTES = 10 * 1024 * 1024;

export type ProcessedImageVariants = {
  /** Raw upload bytes preserved for archival / re-processing (copy of input when safe). */
  original: Buffer;
  thumb: Buffer;
  preview: Buffer;
  full: Buffer;
};

export type ProcessImageOptions = {
  /** Crop ~88% centered square before resize — mild framing only (no object detection). */
  safeCenterCrop?: boolean;
  /** Stored alongside derivatives — uncropped upload when pipeline uses cropped/normalized input. */
  archiveOriginal?: Buffer;
};

/**
 * Single optimized JPEG (full-size variant) — same pipeline as {@link generateImageVariants}.`full`.
 */
export async function processImage(buffer: Buffer, opts?: ProcessImageOptions): Promise<Buffer> {
  const v = await generateImageVariants(buffer, opts);
  return v.full;
}

/** Resize buffers from an already-developed master without re-applying heavy corrections (avoid stacking artifacts). */
async function resizeToMax(buffer: Buffer, maxWidth: number, quality: number): Promise<Buffer> {
  return sharp(buffer)
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

/**
 * Builds thumbnail / preview / full JPEG variants plus keeps original bytes.
 * Runs pipeline server-side; intended for FSBO listing uploads.
 */
export async function generateImageVariants(
  buffer: Buffer,
  opts?: ProcessImageOptions,
): Promise<ProcessedImageVariants> {
  if (buffer.length > IMAGE_PROCESS_MAX_BYTES) {
    throw new Error(`Image exceeds ${IMAGE_PROCESS_MAX_BYTES / (1024 * 1024)}MB processing limit`);
  }

  const original =
    opts?.archiveOriginal != null ? Buffer.from(opts.archiveOriginal) : Buffer.from(buffer);

  let pipeline = sharp(buffer).rotate().normalize();

  if (opts?.safeCenterCrop) {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w > 32 && h > 32) {
      const side = Math.round(Math.min(w, h) * 0.88);
      const left = Math.max(0, Math.round((w - side) / 2));
      const top = Math.max(0, Math.round((h - side) / 2));
      pipeline = sharp(
        await sharp(buffer).rotate().normalize().extract({ left, top, width: side, height: side }).toBuffer(),
      );
    }
  }

  const master = await pipeline
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .modulate({
      brightness: 1.05,
      saturation: 1.05,
    })
    .sharpen({ sigma: 0.45, m1: 0.6, m2: 0.35 })
    .toBuffer();

  const [full, preview, thumb] = await Promise.all([
    sharp(master).jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
    resizeToMax(master, 800, 82),
    resizeToMax(master, 300, 78),
  ]);

  return { original, thumb, preview, full };
}
