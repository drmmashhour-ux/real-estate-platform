/**
 * Hub themes – role-aligned accent colors (premium dashboards).
 */

export type HubTheme = {
  bg: string;
  accent: string;
  sidebarBg?: string;
  cardBg?: string;
  text?: string;
  textMuted?: string;
};

/** User / BNHub stays: host-leaning green. Real estate buyer hub: blue. Luxury: black/gold. Broker: purple. Admin: gold on black. */
export const hubThemes: Record<string, HubTheme> = {
  bnhub: {
    bg: "#f0fdf4",
    accent: "#16A34A",
    sidebarBg: "#ecfdf5",
    cardBg: "#ffffff",
    text: "#14532d",
    textMuted: "#4d7c5c",
  },
  realEstate: {
    bg: "#eff6ff",
    accent: "#2563EB",
    sidebarBg: "#dbeafe",
    cardBg: "#ffffff",
    text: "#1e3a8a",
    textMuted: "#64748b",
  },
  luxury: {
    bg: "#0B0B0B",
    accent: "#C9A646",
    sidebarBg: "#111111",
    cardBg: "rgba(201, 166, 70,0.06)",
    text: "#ffffff",
    textMuted: "#B0B0B0",
  },
  broker: {
    bg: "#0B0B0B",
    accent: "#C9A646",
    sidebarBg: "#111111",
    cardBg: "rgba(201, 166, 70, 0.06)",
    text: "#ffffff",
    textMuted: "#B0B0B0",
  },
  investments: {
    bg: "#0b1020",
    accent: "#22c55e",
    sidebarBg: "#0f172a",
    cardBg: "rgba(255,255,255,0.05)",
    text: "#f0fdf4",
    textMuted: "rgba(255,255,255,0.6)",
  },
  projects: {
    bg: "#0c1222",
    accent: "#14b8a6",
    sidebarBg: "#0f172a",
    cardBg: "rgba(255,255,255,0.05)",
    text: "#f0fdfa",
    textMuted: "rgba(255,255,255,0.6)",
  },
  admin: {
    bg: "#0B0B0B",
    accent: "#C9A646",
    sidebarBg: "#111111",
    cardBg: "rgba(201, 166, 70,0.07)",
    text: "#ffffff",
    textMuted: "#B0B0B0",
  },
  public: {
    bg: "#0B0B0B",
    accent: "#C9A646",
    sidebarBg: "#111111",
    cardBg: "#111111",
    text: "#ffffff",
    textMuted: "#B0B0B0",
  },
};

export function getHubTheme(hubKey: string): HubTheme {
  return hubThemes[hubKey] ?? hubThemes.realEstate;
}
