/**
 * Maps semantic UI roles to Tailwind-friendly class fragments.
 * Compose with `cn()` / array join at component boundary.
 */

export const buttonVariantIntent = {
  primary: "inverse",
  goldPrimary: "gold",
  secondary: "neutral",
  outline: "outline",
  ghost: "ghost",
  danger: "danger",
  seniorPrimary: "senior",
} as const;

export const badgeIntent = [
  "verified",
  "active",
  "pending",
  "warning",
  "error",
  "highPriority",
  "bestMatch",
  "aiSuggested",
  "neutral",
] as const;
