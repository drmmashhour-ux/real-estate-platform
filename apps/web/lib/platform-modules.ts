/**
 * Platform module metadata for nav, home CTAs, and badges.
 * Keep labels neutral (no third-party brand references).
 */

export type PlatformModuleKey =
  | "bnhub"
  | "hotelHub"
  | "flights"
  | "packages"
  | "sharing";

export type PlatformModule = {
  key: PlatformModuleKey;
  name: string;
  tagline: string;
  href: string;
  /** Short label for badges (e.g. "BNHub stays") */
  styleLabel: string;
  /** If true, highlight as platform differentiator */
  uniqueFeature?: boolean;
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    key: "bnhub",
    name: "BNHub",
    tagline: "Short-term rentals & stays",
    href: "/search/bnhub",
    styleLabel: "BNHub stays",
  },
  {
    key: "hotelHub",
    name: "Hotel Hub",
    tagline: "Hotels & rooms",
    href: "/search/hotels",
    styleLabel: "Hotel search",
  },
  {
    key: "flights",
    name: "Flights",
    tagline: "Search & book flights",
    href: "/flights",
    styleLabel: "API integration",
  },
  {
    key: "packages",
    name: "Packages",
    tagline: "Destinations & bundles",
    href: "/packages",
    styleLabel: "Bundles & trips",
  },
  {
    key: "sharing",
    name: "Sharing",
    tagline: "Join a stay with others",
    href: "/shared",
    styleLabel: "Unique feature",
    uniqueFeature: true,
  },
];

export function getPlatformModule(key: PlatformModuleKey): PlatformModule | undefined {
  return PLATFORM_MODULES.find((m) => m.key === key);
}
