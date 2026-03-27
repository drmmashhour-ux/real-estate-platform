/**
 Public marketing contact — use NEXT_PUBLIC_* so values are available in client components.
 Set real URLs and phone in deployment; omit social envs to hide those links.
 */

import { getContactEmail, getContactMailtoHref } from "@/lib/config/contact";

function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/** Primary inbound email (display + mailto). Override in production with NEXT_PUBLIC_CONTACT_EMAIL. */
export function getPublicContactEmail(): string {
  return getContactEmail();
}

export function getPublicContactMailto(): string {
  return getContactMailtoHref();
}

export type SocialLinkKey = "linkedin" | "instagram" | "x";

/** Only includes keys with non-empty env URLs. */
export function getPublicSocialLinks(): Partial<Record<SocialLinkKey, string>> {
  const out: Partial<Record<SocialLinkKey, string>> = {};
  const li = env("NEXT_PUBLIC_SOCIAL_LINKEDIN_URL");
  const ig = env("NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL");
  const x = env("NEXT_PUBLIC_SOCIAL_X_URL");
  if (li) out.linkedin = li;
  if (ig) out.instagram = ig;
  if (x) out.x = x;
  return out;
}

export function hasPublicSocialLinks(): boolean {
  const s = getPublicSocialLinks();
  return Boolean(s.linkedin || s.instagram || s.x);
}
