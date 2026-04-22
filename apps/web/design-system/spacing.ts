/** 8px-based scale (Part 4): 4–64px */
export const spacingPx = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

export type SpacingKey = keyof typeof spacingPx;

/** Class helpers for vertical rhythm & card insets */
export const spacingClass = {
  cardPadding: "p-5 sm:p-6", // 20–24px
  sectionGap: "space-y-6 md:space-y-8", // 24–32px
  stackXs: "gap-1",
  stackSm: "gap-2",
  stackMd: "gap-4",
  stackLg: "gap-6",
  stackXl: "gap-8",
  insetPage: "px-4 py-6 sm:px-6 md:py-8",
  /** Senior / large touch — extra air */
  seniorSection: "space-y-8 md:space-y-10",
} as const;
