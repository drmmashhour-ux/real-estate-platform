/**
 * Canonical public origin for redirects, Stripe return URLs, emails, and absolute links.
 *
 * Order: `NEXT_PUBLIC_APP_URL` → Vercel preview URL → **development default `http://localhost:3001`**
 * (avoids clashes with other apps on :3000) → production fallback `https://lecipm.com`.
 *
 * Deployed production should always set `NEXT_PUBLIC_APP_URL`; the last fallback is only
 * for misconfiguration and is not used when env is set correctly.
 */
export function getPublicAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3001";
  return "https://lecipm.com";
}
