import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return (
    process.env.LISTING_ANALYSIS_SHARE_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "dev-only-change-me"
  );
}

export type SharePayload = {
  listingId: string;
  ownerId: string;
  exp: number;
};

/** Signed token (base64url.payload + "." + base64url.sig) — verify server-side only. */
export function signListingAnalysisShare(payload: SharePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyListingAnalysisShareToken(token: string): SharePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SharePayload;
    if (!raw.listingId || !raw.ownerId || typeof raw.exp !== "number") return null;
    if (Math.floor(Date.now() / 1000) > raw.exp) return null;
    return raw;
  } catch {
    return null;
  }
}
