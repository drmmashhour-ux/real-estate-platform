import { createHash } from "node:crypto";

/** SHA-256 of UTF-8 document content for immutability / audit. */
export function generateDocumentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
