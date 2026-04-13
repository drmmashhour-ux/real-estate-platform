import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET?.trim() || process.env.META_APP_SECRET?.trim();
  if (!s) throw new Error("OAUTH_STATE_SECRET or META_APP_SECRET required for OAuth state");
  return s;
}

export function signOAuthState(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState<T extends Record<string, unknown>>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    const exp = (json as { exp?: number }).exp;
    if (typeof exp === "number" && Date.now() > exp) return null;
    return json;
  } catch {
    return null;
  }
}
