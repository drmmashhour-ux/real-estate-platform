export const EQUITY_ROLES = ["founder", "employee", "advisor", "investor"] as const;
export type EquityRole = (typeof EQUITY_ROLES)[number];

export function isEquityRole(s: string): s is EquityRole {
  return (EQUITY_ROLES as readonly string[]).includes(s);
}
