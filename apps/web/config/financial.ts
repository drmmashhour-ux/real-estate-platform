export const FINANCIAL_CONFIG = {
  business: {
    legalName: "MOHAMED ALMASHHOUR",
    address: {
      line1: "805, boul. Chomedey, porte 207",
      city: "Laval",
      province: "QC",
      postalCode: "H7V 0B1",
      country: "Canada",
    },
  },

  tax: {
    qst: {
      number: "4025075621",
      file: "TQ0002",
      rate: 0.09975,
    },
    gst: {
      number: "766525877RT0001",
      rate: 0.05,
    },
  },

  reporting: {
    frequency: "annual",
    firstPeriod: {
      from: "2024-07-23",
      to: "2024-12-31",
    },
    firstDeadline: "2025-04-30",
  },
} as const;

export type FinancialConfig = typeof FINANCIAL_CONFIG;

/** Multiline mailing address for invoices and PDFs. */
export function formatFinancialBusinessAddress(
  addr: FinancialConfig["business"]["address"] = FINANCIAL_CONFIG.business.address,
): string {
  return [
    addr.line1,
    `${addr.city}, ${addr.province} ${addr.postalCode}`,
    addr.country,
  ].join("\n");
}
