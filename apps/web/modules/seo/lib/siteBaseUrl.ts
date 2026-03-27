/** Canonical site origin for sitemaps, JSON-LD, and meta URLs. */
export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : "http://localhost:3000")
  );
}
