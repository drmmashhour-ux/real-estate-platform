/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 * Set GROWTH_TOKEN_ENCRYPTION_KEY to 64 hex characters (32 bytes).
 * Never log decrypted values.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const IV_LEN = 12;
const TAG_LEN = 16;

function resolveKey(): Buffer {
  const hex = process.env.GROWTH_TOKEN_ENCRYPTION_KEY?.trim();
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  const fallback = process.env.GROWTH_TOKEN_ENCRYPTION_SECRET?.trim();
  if (fallback && fallback.length >= 16) {
    return scryptSync(fallback, "growth-automation-salt", 32);
  }
  throw new Error(
    "Missing GROWTH_TOKEN_ENCRYPTION_KEY (64 hex chars) or GROWTH_TOKEN_ENCRYPTION_SECRET (16+ chars for dev-only scrypt)",
  );
}

export function encryptGrowthSecret(plaintext: string): string {
  const key = resolveKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptGrowthSecret(encrypted: string): string {
  const key = resolveKey();
  const buf = Buffer.from(encrypted, "base64url");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isGrowthTokenVaultConfigured(): boolean {
  try {
    resolveKey();
    return true;
  } catch {
    return false;
  }
}
