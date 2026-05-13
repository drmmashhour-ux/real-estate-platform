import { getDesignTokens, type DesignTokens, type ThemeMode } from "../design-system/tokens.js";

export interface BrandIdentity {
  brandName: "Nexora" | string;
  logoPlaceholder: string;
  supportContact: string;
  themeMode: ThemeMode;
  tokens: DesignTokens;
}

export const nexoraBrand: BrandIdentity = Object.freeze({
  brandName: "Nexora",
  logoPlaceholder: "/brand/nexora-logo-placeholder.svg",
  supportContact: "support@nexora.example",
  themeMode: "light",
  tokens: getDesignTokens("light"),
});

export function createBrandIdentity(overrides: Partial<Omit<BrandIdentity, "tokens">> = {}): BrandIdentity {
  const themeMode = overrides.themeMode ?? nexoraBrand.themeMode;
  return Object.freeze({
    ...nexoraBrand,
    ...overrides,
    themeMode,
    tokens: getDesignTokens(themeMode),
  });
}
