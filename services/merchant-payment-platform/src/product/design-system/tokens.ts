export type ThemeMode = "light" | "dark";

export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    danger: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    weights: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}

export const nexoraLightTokens: DesignTokens = Object.freeze({
  colors: {
    primary: "#635BFF",
    primaryHover: "#4F46E5",
    secondary: "#00B8A9",
    accent: "#F59E0B",
    background: "#F6F8FB",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    border: "#E5E7EB",
    text: "#111827",
    textMuted: "#6B7280",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "20px",
    pill: "999px",
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    sizes: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "20px",
      xl: "28px",
      xxl: "40px",
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
});

export const nexoraDarkTokens: DesignTokens = Object.freeze({
  ...nexoraLightTokens,
  colors: {
    ...nexoraLightTokens.colors,
    background: "#0B1020",
    surface: "#111827",
    surfaceRaised: "#172033",
    border: "#263248",
    text: "#F9FAFB",
    textMuted: "#AAB2C0",
  },
});

export function getDesignTokens(mode: ThemeMode): DesignTokens {
  return mode === "dark" ? nexoraDarkTokens : nexoraLightTokens;
}
