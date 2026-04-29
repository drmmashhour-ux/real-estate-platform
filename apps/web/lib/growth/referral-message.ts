/**
 * Client-safe invite copy (no Node / DB dependencies).
 * Server-side referral analytics stay in `lib/growth/referral.ts`.
 */
export function getReferralMessage(link: string) {
  return `Get early access to better listings: ${link}`;
}
