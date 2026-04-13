import { createHash } from "node:crypto";

/** Stable fingerprint for IPv4/IPv6 client strings (matches auth routes). */
export function fingerprintClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export function getClientIpFromRequest(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
