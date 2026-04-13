import { createHash, randomBytes } from "crypto";

export function generateGuestThreadToken(): { raw: string; hash: string } {
  const raw = randomBytes(24).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashGuestToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
