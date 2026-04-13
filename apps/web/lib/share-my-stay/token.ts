import { createHash, randomBytes } from "crypto";

/**
 * Cryptographically secure random token for URL segments.
 * Never persist — store only `hashToken(raw)`.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest of the raw token (matches stored `public_token_hash`). */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
