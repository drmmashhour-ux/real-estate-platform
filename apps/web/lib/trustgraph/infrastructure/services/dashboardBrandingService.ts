export function parseWorkspaceBranding(raw: unknown): {
  logoUrl: string | null;
  primaryColor: string | null;
  displayLabel: string | null;
} {
  if (!raw || typeof raw !== "object") {
    return { logoUrl: null, primaryColor: null, displayLabel: null };
  }
  const o = raw as Record<string, unknown>;
  return {
    logoUrl: typeof o.logoUrl === "string" ? o.logoUrl : null,
    primaryColor: typeof o.primaryColor === "string" ? o.primaryColor : null,
    displayLabel: typeof o.displayLabel === "string" ? o.displayLabel : null,
  };
}
