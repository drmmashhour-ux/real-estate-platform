/**
 * Canonical demo accounts for Prestige + Urban tenants (`npm run demo:full`).
 * Password: `Demo123!` unless `DEMO_FULL_PASSWORD` / `DEMO_FULL_CLEAR` script overrides.
 */

export const DEMO_DEFAULT_PASSWORD = "Demo123!";

/** All demo user emails — include in `DEMO_RESET_KEEP_EMAILS` for staging reset. */
export const DEMO_ACCOUNT_EMAILS = [
  "sarah@prestige.demo",
  "david@prestige.demo",
  "emily@prestige.demo",
  "alex@prestige.demo",
  "michael@client.demo",
  "emma@client.demo",
  "lisa@urban.demo",
  "james@urban.demo",
  /** Full DB seed (`prisma/seed.ts`) — verified + password; use Demo123! except guest. */
  "guest@demo.com",
  "demo@platform.com",
  "host@demo.com",
  "host2@demo.com",
  "broker@demo.com",
  "ambassador@demo.com",
  "investor@demo.com",
] as const;

export type DemoAccountEmail = (typeof DEMO_ACCOUNT_EMAILS)[number];

export function isDemoAccountEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return (DEMO_ACCOUNT_EMAILS as readonly string[]).includes(e);
}

/** Comma-separated default for `lib/demo-reset.ts` documentation / .env.example */
export const DEMO_RESET_KEEP_EMAILS_DEFAULT = DEMO_ACCOUNT_EMAILS.join(",");
