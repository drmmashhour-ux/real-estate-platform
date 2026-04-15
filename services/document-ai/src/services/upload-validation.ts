const PDF_MAGIC_PREFIX = "%PDF-";
const AI_EXTENSION_REGEX = /\.ai$/i;

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/postscript",
  "application/illustrator",
  "application/vnd.adobe.illustrator",
  "application/x-illustrator",
  "application/octet-stream",
]);

export type UploadFileLike = {
  mimetype?: string;
  originalname?: string;
};

export function isSupportedUploadFile(file: UploadFileLike): boolean {
  const mimeType = file.mimetype?.toLowerCase() ?? "";
  const originalName = file.originalname ?? "";

  if (mimeType === "application/pdf") return true;

  const isAiExtension = AI_EXTENSION_REGEX.test(originalName);
  if (!isAiExtension) return false;

  return ACCEPTED_MIME_TYPES.has(mimeType);
}

export function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC_PREFIX.length) return false;
  return buffer.subarray(0, PDF_MAGIC_PREFIX.length).toString("ascii") === PDF_MAGIC_PREFIX;
}
