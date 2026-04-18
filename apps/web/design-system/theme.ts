import { animations } from "./animations";
import { colorTokens } from "./tokens";
import { shadows } from "./shadows";
import { spacing, spacingClass } from "./spacing";
import { type } from "./typography";

/** Single import for product UI — pair with Tailwind `ds-*` utilities. */
export const lecipmTheme = {
  colors: colorTokens,
  spacing,
  spacingClass,
  type,
  shadows,
  animations,
} as const;

export type LecipmTheme = typeof lecipmTheme;
