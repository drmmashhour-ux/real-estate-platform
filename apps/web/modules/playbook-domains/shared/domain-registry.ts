import type { PlaybookDomainModule } from "./domain.types";
import { dreamHomeDomainModule } from "../dream-home/dream-home.module";
import { growthDomainModule } from "../growth/growth.module";
import { leadsDomainModule } from "../leads/leads.module";
import { listingsDomainModule } from "../listings/listings.module";

/**
 * Additive domain modules. Unknown domains are not errors—callers use generic engine paths.
 */
export const playbookDomainRegistry = {
  GROWTH: growthDomainModule,
  LEADS: leadsDomainModule,
  LISTINGS: listingsDomainModule,
  DREAM_HOME: dreamHomeDomainModule,
} as const;

export function getDomainModule(domain: string): PlaybookDomainModule | null {
  if (domain == null || String(domain).trim() === "") {
    return null;
  }
  const k = String(domain).trim().toUpperCase() as keyof typeof playbookDomainRegistry;
  if (Object.prototype.hasOwnProperty.call(playbookDomainRegistry, k)) {
    return playbookDomainRegistry[k];
  }
  return null;
}
