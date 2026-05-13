export interface BrandTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    success: string;
    warning: string;
    danger: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface BrandConfiguration {
  brandName: string;
  companyName: string;
  supportEmail: string;
  logoUrl: string;
  currencyDisplay: {
    locale: string;
    currency: string;
    minimumFractionDigits: number;
  };
  theme: {
    mode: "light" | "dark";
    borderRadius: string;
    tokens: BrandTokens;
  };
}

export const defaultBrandConfiguration: BrandConfiguration = {
  brandName: "MerchantPay",
  companyName: "Merchant Payments Company",
  supportEmail: "support@example.invalid",
  logoUrl: "https://example.invalid/logo-placeholder.svg",
  currencyDisplay: {
    locale: "en-US",
    currency: "USD",
    minimumFractionDigits: 2,
  },
  theme: {
    mode: "light",
    borderRadius: "12px",
    tokens: {
      colors: {
        primary: "#1746A2",
        secondary: "#22A699",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#111827",
        mutedText: "#6B7280",
        success: "#15803D",
        warning: "#B45309",
        danger: "#B91C1C",
      },
      typography: {
        fontFamily: "Inter, system-ui, sans-serif",
        headingWeight: 700,
        bodyWeight: 400,
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
    },
  },
};

export function createBrandConfiguration(
  overrides: Partial<BrandConfiguration> = {},
): BrandConfiguration {
  return Object.freeze({
    ...defaultBrandConfiguration,
    ...overrides,
    currencyDisplay: {
      ...defaultBrandConfiguration.currencyDisplay,
      ...overrides.currencyDisplay,
    },
    theme: {
      ...defaultBrandConfiguration.theme,
      ...overrides.theme,
      tokens: {
        ...defaultBrandConfiguration.theme.tokens,
        ...overrides.theme?.tokens,
        colors: {
          ...defaultBrandConfiguration.theme.tokens.colors,
          ...overrides.theme?.tokens?.colors,
        },
        typography: {
          ...defaultBrandConfiguration.theme.tokens.typography,
          ...overrides.theme?.tokens?.typography,
        },
        spacing: {
          ...defaultBrandConfiguration.theme.tokens.spacing,
          ...overrides.theme?.tokens?.spacing,
        },
      },
    },
  });
}

export function formatBrandMoney(amountMinor: number, brand: BrandConfiguration): string {
  return new Intl.NumberFormat(brand.currencyDisplay.locale, {
    style: "currency",
    currency: brand.currencyDisplay.currency,
    minimumFractionDigits: brand.currencyDisplay.minimumFractionDigits,
  }).format(amountMinor / 100);
}
