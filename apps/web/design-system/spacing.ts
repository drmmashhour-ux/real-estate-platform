/** 4-based scale — maps to Tailwind spacing & `--spacing-ds-*` in CSS. */
export const spacing = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
  7: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Class helpers for stacks (gap / padding) */
export const spacingClass = {
  stackXs: "gap-1", // 4px
  stackSm: "gap-2", // 8px
  stackMd: "gap-4", // 16px
  stackLg: "gap-6", // 24px
  stackXl: "gap-8", // 32px
  insetPage: "px-4 py-6 sm:px-6 md:py-8",
} as const;
