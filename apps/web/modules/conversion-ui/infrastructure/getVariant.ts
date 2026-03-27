import { conversionVariants } from "@/src/design/conversionVariants";

export function getVariant<T extends keyof typeof conversionVariants>(key: T) {
  return conversionVariants[key];
}
