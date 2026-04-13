import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALG = "aes-256-gcm";

function encryptionKey(): Buffer | null {
  const s = process.env.SHARE_SESSIONS_ENCRYPTION_KEY?.trim();
  if (!s || s.length < 8) return null;
  return createHash("sha256").update(s, "utf8").digest();
}

/** Encrypt email/recipient value for at-rest storage. Returns null if env not configured (caller may skip storing). */
export function encryptRecipientValue(plain: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const c = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptRecipientValue(b64: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(b64, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const d = createDecipheriv(ALG, key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
