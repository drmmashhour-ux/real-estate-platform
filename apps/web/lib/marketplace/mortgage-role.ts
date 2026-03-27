/** Mortgage specialist roles — product uses `MORTGAGE_BROKER`; legacy rows use `MORTGAGE_EXPERT`. */
export function isMortgageExpertRole(role: string | null | undefined): boolean {
  return role === "MORTGAGE_EXPERT" || role === "MORTGAGE_BROKER";
}
