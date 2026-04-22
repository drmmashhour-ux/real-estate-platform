/**
 * Single icon library: lucide-react only (Part 17).
 * Default stroke icons at 20–24px for dashboard clarity.
 */
export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

/** Semantic categories — map to Lucide exports at call sites. */
export const iconCategories = [
  "leads",
  "visits",
  "residences",
  "cities",
  "analytics",
  "ai",
  "alerts",
  "settings",
  "profile",
  "messages",
] as const;
