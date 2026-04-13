/**
 * Hub themes — unified LECIPM luxury shell (black / gold) across every hub.
 * Hub keys remain for navigation semantics; surfaces share one premium palette.
 */

export type HubTheme = {
  bg: string;
  accent: string;
  sidebarBg?: string;
  cardBg?: string;
  text?: string;
  textMuted?: string;
};

const LECIPM_PREMIUM_HUB: HubTheme = {
  bg: "#0B0B0B",
  accent: "var(--color-premium-gold)",
  sidebarBg: "#111111",
  cardBg: "rgb(var(--premium-gold-channels) / 0.06)",
  text: "#ffffff",
  textMuted: "#B0B0B0",
};

export const hubThemes: Record<string, HubTheme> = {
  bnhub: { ...LECIPM_PREMIUM_HUB },
  /** LECIPM Hub Engine — car rental vertical (beta when enabled). */
  carhub: { ...LECIPM_PREMIUM_HUB },
  servicehub: { ...LECIPM_PREMIUM_HUB },
  investorhub: { ...LECIPM_PREMIUM_HUB },
  realEstate: { ...LECIPM_PREMIUM_HUB },
  financialHub: { ...LECIPM_PREMIUM_HUB },
  luxury: { ...LECIPM_PREMIUM_HUB },
  broker: { ...LECIPM_PREMIUM_HUB },
  investments: { ...LECIPM_PREMIUM_HUB, cardBg: "rgb(var(--premium-gold-channels) / 0.07)" },
  projects: { ...LECIPM_PREMIUM_HUB, cardBg: "rgb(var(--premium-gold-channels) / 0.07)" },
  admin: { ...LECIPM_PREMIUM_HUB, cardBg: "rgb(var(--premium-gold-channels) / 0.07)" },
  public: { ...LECIPM_PREMIUM_HUB, cardBg: "#111111" },
};

export function getHubTheme(hubKey: string): HubTheme {
  return hubThemes[hubKey] ?? LECIPM_PREMIUM_HUB;
}
