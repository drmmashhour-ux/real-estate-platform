/**
 * Lead-magnet surfaces (require login via `app/invest/tools/layout.tsx`).
 */
export const LEAD_MAGNET_TOOLS = {
  roiCalculator: "/invest/tools/roi",
  investmentAnalyzer: "/tools/deal-analyzer",
  comparisonTool: "/dashboard/investments/compare",
} as const;

export type LeadMagnetToolKey = keyof typeof LEAD_MAGNET_TOOLS;
