/**
 * Image compression: resize oversized images, compress, convert to WebP.
 * Returns originalSize, compressedSize, savedBytes. Run automatically on image upload.
 */
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 85;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type CompressionResult = {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  format: "webp" | "original";
  skipped: boolean;
  error?: string;
};

export async function compressImage(
  inputBuffer: Buffer,
  mimeType?: string
): Promise<CompressionResult> {
  const originalSize = inputBuffer.length;
  const type = (mimeType || "").toLowerCase();

  if (!SUPPORTED_IMAGE_TYPES.has(type) && !type.startsWith("image/")) {
    return {
      buffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      savedBytes: 0,
      format: "original",
      skipped: true,
    };
  }

  try {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(inputBuffer, { failOnError: false });

    const meta = await pipeline.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const needsResize = width > MAX_WIDTH || height > MAX_HEIGHT;

    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true });
    }

    pipeline = pipeline.webp({ quality: WEBP_QUALITY });
    const outputBuffer = await pipeline.toBuffer();
    const compressedSize = outputBuffer.length;
    const savedBytes = Math.max(0, originalSize - compressedSize);

    return {
      buffer: outputBuffer,
      originalSize,
      compressedSize,
      savedBytes,
      format: "webp",
      skipped: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compression failed";
    return {
      buffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      savedBytes: 0,
      format: "original",
      skipped: true,
      error: message,
    };
  }
}

/** Check if MIME type is supported for compression. */
export function isCompressibleImage(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(mimeType.toLowerCase());
}
