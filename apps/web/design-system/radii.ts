export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export type RadiusKey = keyof typeof radii;
