/** Max upload size (25 MB). */
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

/** Allowed MIME types for v1 uploads. */
export const DOCUMENT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const DOCUMENT_ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".doc",
  ".docx",
]);
