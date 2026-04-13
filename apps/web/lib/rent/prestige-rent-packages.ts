/**
 * Marketing copy for Prestige Direct — Rentals (DuProprio-style tier ladder).
 * Listing fees for paid tiers are representative CAD amounts until rent checkout is wired to Stripe.
 */

export const PRESTIGE_RENT_DEPARTMENT = {
  name: "Prestige Direct Rentals",
  tagline: "Flexible packages for long-term landlords — plus BNHUB for nightly stays.",
} as const;

/** Illustrative one-time CAD fees for paid rental marketing tiers (confirm at checkout when live). */
export const RENT_MARKETING_SIGN_CAD = 49.95;
export const RENT_MARKETING_SHOWCASE_CAD = 199.95;

export type RentPackageTierId = "free" | "sign" | "showcase";

export type RentPackageTier = {
  id: RentPackageTierId;
  /** Short product name (DuProprio-inspired). */
  label: string;
  /** Amount in CAD; 0 = free lane. */
  priceCad: number;
  mostPopular?: boolean;
  blurb: string;
};

export const RENT_PACKAGE_TIERS: readonly RentPackageTier[] = [
  {
    id: "free",
    label: "The Free lane",
    priceCad: 0,
    blurb: "List and manage long-term rentals from your landlord dashboard — standard reach on Rent Hub search.",
  },
  {
    id: "sign",
    label: "The Sign",
    priceCad: RENT_MARKETING_SIGN_CAD,
    mostPopular: true,
    blurb: "Stronger tenant visibility with yard-style signage credits and boosted placement when the program is active.",
  },
  {
    id: "showcase",
    label: "The Showcase",
    priceCad: RENT_MARKETING_SHOWCASE_CAD,
    blurb: "Maximum exposure: extended featured windows and optional pro media where available.",
  },
] as const;

/** Feature rows for the comparison grid (values per tier). */
export const RENT_PACKAGE_FEATURES: readonly {
  key: string;
  free: string | boolean;
  sign: string | boolean;
  showcase: string | boolean;
  footnote?: boolean;
}[] = [
  {
    key: "Online listing on Rent Hub",
    free: "3 months active",
    sign: "3 months active",
    showcase: "3 months active",
  },
  {
    key: "Photos",
    free: "8",
    sign: "12",
    showcase: "16",
  },
  {
    key: "“For rent” signage support",
    free: false,
    sign: true,
    showcase: true,
  },
  {
    key: "Featured section",
    free: false,
    sign: "1 week",
    showcase: "4 weeks",
  },
  {
    key: "Pro HDR media session",
    free: false,
    sign: false,
    showcase: true,
    footnote: true,
  },
];
