import { colors } from "@/design/colors";

/** Tailwind class bundles for consistent premium surfaces */
export const theme = {
  pageBg: "min-h-screen bg-[#0B0B0B] text-white",
  cardSurface:
    "rounded-2xl border border-white/10 bg-[#121212] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
  cardSurfaceHover:
    "transition duration-200 ease-out hover:scale-[1.02] hover:border-premium-gold/35 hover:shadow-[0_0_32px_rgb(var(--premium-gold-channels) / 0.12)]",
  goldGlow: "shadow-[0_0_24px_rgb(var(--premium-gold-channels) / 0.25)]",
  goldBorderGlow: "border-premium-gold/40 shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.15)]",
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/50",
} as const;

export const cssVarBlock = `
:root {
  --lecipm-bg: ${colors.background};
  --lecipm-card: ${colors.card};
  --lecipm-gold: ${colors.gold};
  --lecipm-text: ${colors.textPrimary};
  --lecipm-muted: ${colors.textSecondary};
}
`;
