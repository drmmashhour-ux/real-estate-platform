/**
 * Placeholder for future file attachments (S3, virus scan, etc.).
 */

export type AttachmentPlaceholder = {
  id: string;
  filename: string;
  mimeType: string;
  byteSize: number;
};

export function attachmentsNotSupported(): never {
  throw new Error("Attachments are not enabled yet.");
}
