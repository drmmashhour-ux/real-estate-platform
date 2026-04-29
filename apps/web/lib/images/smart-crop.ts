import sharp from "sharp";

/** Output frame for listing hero-style framing (attention-weighted crop). */
const TARGET_W = 1200;
const TARGET_H = 800;

/**
 * Sharp entropy/attention-based cover crop — framing only; does not invent pixels.
 * Falls back to the input buffer if the image is too small or processing fails.
 */
export async function smartCrop(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 64 || h < 64) {
    return buffer;
  }
  try {
    return await sharp(buffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, {
        fit: "cover",
        position: sharp.strategy.attention,
      })
      .toBuffer();
  } catch {
    return buffer;
  }
}
