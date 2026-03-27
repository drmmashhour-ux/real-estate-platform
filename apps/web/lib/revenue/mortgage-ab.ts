/** Valid A/B labels for mortgage request CTA experiment */
export type MortgageAbVariant = "A" | "B";

export function normalizeMortgageAbVariant(raw: unknown): MortgageAbVariant {
  return raw === "B" ? "B" : "A";
}

export function mortgageCtaLabel(variant: MortgageAbVariant): string {
  return variant === "B" ? "Get my free rate check — experts respond fast" : "Get matched with a mortgage expert";
}
