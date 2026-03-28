import { createHash, randomBytes } from "crypto";

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Returns one-time plaintext — persist only `keyHash`. */
export function createPlatformApiKeySecret(): { plaintext: string; keyHash: string } {
  const plaintext = `lecipm_pk_${randomBytes(24).toString("base64url")}`;
  return { plaintext, keyHash: hashApiKey(plaintext) };
}
