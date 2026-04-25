/**
 * Static, versioned catalog of Québec / Canada retrofit incentives for internal estimation only.
 * All outputs must be labeled estimated; eligibility must be verified with official programs.
 *
 * sourceUrlKey resolves via SOURCE_URLS — do not embed raw URLs in UI copy.
 */

export const QUEBEC_ESG_INCENTIVES_CATALOG_VERSION = "2026-04-23";

/** When the catalog as a whole was last reviewed against public program pages (best effort). */
export const QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT = "2026-04-23";

export type IncentiveCatalogStatus = "active" | "conditional" | "closed";

export type IncentiveAmountType = "fixed" | "range" | "informational";

export type QuebecEsgIncentiveCatalogEntry = {
  key: string;
  title: string;
  jurisdiction: "QC" | "CA" | "QC_CA";
  status: IncentiveCatalogStatus;
  amountType: IncentiveAmountType;
  /** Single published amount when clearly stated (CAD). */
  amountValue: number | null;
  amountRange: { low: number; high: number } | null;
  eligibilitySummary: string;
  sourceLabel: string;
  sourceUrlKey: string;
  /** ISO date — program start, rate effective date, or closure date context in disclaimer. */
  effectiveDate: string;
  disclaimer: string;
  lastVerifiedAt: string;
  /** Retrofit themes for matching recommendations (internal). */
  relatedRetrofitCategories: string[];
};

/**
 * Official / program home pages (verify before relying on amounts).
 * Keys are stable identifiers for logs and UI-safe references.
 */
export const SOURCE_URLS: Record<string, string> = {
  quebec_renoclimat:
    "https://www.quebec.ca/en/housing-and-territory/building-renovation-financial-assistance",
  quebec_transition_ecologique_home: "https://www.quebec.ca/en/government/policies-orientations/environment-energy-transition",
  canada_oil_heat_pump_affordability: "https://www.nrcan.gc.ca/energy-efficiency/homes/oil-heat-pump-affordability/24339",
  canada_greener_homes_loan: "https://www.canada.ca/en/environment-climate-change/services/energy-efficiency/funding-programs/greener-homes-loan.html",
  canada_greener_homes_affordability: "https://www.canada.ca/en/environment-climate-change/services/energy-efficiency/funding-programs/greener-homes-affordability-program.html",
  canada_chauffez_vert_archive_note:
    "https://www.canada.ca/en/environment-climate-change/services/energy-efficiency/funding-programs.html",
};

const COMMON_DISCLAIMER =
  "Estimated only. Amounts, caps, and eligibility change; confirm with the official program before advising clients or homeowners.";

export const QUEBEC_ESG_INCENTIVES_CATALOG: QuebecEsgIncentiveCatalogEntry[] = [
  {
    key: "renoclimat_windows_doors_per_opening",
    title: "Rénoclimat — financial assistance (windows and doors, per rough opening)",
    jurisdiction: "QC",
    status: "conditional",
    amountType: "fixed",
    amountValue: 150,
    amountRange: null,
    eligibilitySummary:
      "Québec homeowner eligibility, energy evaluation and approved work under Rénoclimat rules; amount published as assistance per eligible rough opening (verify current rate sheet).",
    sourceLabel: "Gouvernement du Québec — Rénoclimat / renovation assistance",
    sourceUrlKey: "quebec_renoclimat",
    effectiveDate: "2024-01-01",
    disclaimer: `${COMMON_DISCLAIMER} Per-opening cap; number of openings drives total assistance.`,
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: ["windows"],
  },
  {
    key: "renoclimat_hrv_erv",
    title: "Rénoclimat — mechanical ventilation (HRV/ERV) incentive",
    jurisdiction: "QC",
    status: "conditional",
    amountType: "fixed",
    amountValue: 500,
    amountRange: null,
    eligibilitySummary:
      "Typically requires eligible HRV/ERV installation under program rules after evaluation; confirm model and installation requirements.",
    sourceLabel: "Gouvernement du Québec — Rénoclimat",
    sourceUrlKey: "quebec_renoclimat",
    effectiveDate: "2024-01-01",
    disclaimer: COMMON_DISCLAIMER,
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: ["ventilation"],
  },
  {
    key: "chauffez_vert_oil_propane_closed",
    title: "Chauffez vert — oil/propane to electric conversion (historical)",
    jurisdiction: "CA",
    status: "closed",
    amountType: "informational",
    amountValue: null,
    amountRange: null,
    eligibilitySummary:
      "Former federal conversion program; do not present as a current application path without verifying program status on the official federal listing.",
    sourceLabel: "Canada — historical energy-efficiency programs (verify closure)",
    sourceUrlKey: "canada_chauffez_vert_archive_note",
    effectiveDate: "2026-03-31",
    disclaimer:
      "Treated as closed for current planning as of lastVerifiedAt; archived details may still appear on government pages. Always verify on the live federal program site.",
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: ["heat_pump", "heating_conversion"],
  },
  {
    key: "canada_oil_to_heat_pump_affordability",
    title: "Oil to Heat Pump Affordability Program",
    jurisdiction: "CA",
    status: "active",
    amountType: "informational",
    amountValue: null,
    amountRange: null,
    eligibilitySummary:
      "Federal program for eligible oil-heated homes meeting income and technical criteria; grant level depends on household and installation — use official calculator and intake.",
    sourceLabel: "Natural Resources Canada",
    sourceUrlKey: "canada_oil_heat_pump_affordability",
    effectiveDate: "2024-01-01",
    disclaimer: `${COMMON_DISCLAIMER} Do not quote a fixed grant amount without the official assessment.`,
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: ["heat_pump", "heating_conversion"],
  },
  {
    key: "canada_greener_homes_loan",
    title: "Canada Greener Homes Loan (interest-free financing — available subject to eligibility)",
    jurisdiction: "CA",
    status: "active",
    amountType: "informational",
    amountValue: null,
    amountRange: null,
    eligibilitySummary:
      "Interest-free financing for eligible retrofits for qualifying homeowners; loan limits and eligible measures are defined by the federal program.",
    sourceLabel: "Canada — Greener Homes Loan",
    sourceUrlKey: "canada_greener_homes_loan",
    effectiveDate: "2024-01-01",
    disclaimer: `${COMMON_DISCLAIMER} This is financing, not a grant; eligibility and caps are program-specific.`,
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: [
      "attic_insulation",
      "wall_insulation",
      "windows",
      "heat_pump",
      "ventilation",
      "solar",
      "green_roof",
    ],
  },
  {
    key: "canada_greener_homes_affordability_program",
    title: "Canada Greener Homes Affordability Program",
    jurisdiction: "CA",
    status: "conditional",
    amountType: "informational",
    amountValue: null,
    amountRange: null,
    eligibilitySummary:
      "Delivered through participating provinces and territories; eligibility and benefits depend on the delivery agent in Québec or elsewhere.",
    sourceLabel: "Canada — Greener Homes Affordability Program",
    sourceUrlKey: "canada_greener_homes_affordability",
    effectiveDate: "2024-01-01",
    disclaimer: `${COMMON_DISCLAIMER} Stack carefully with provincial programs; double-dipping rules apply.`,
    lastVerifiedAt: QUEBEC_ESG_INCENTIVE_CATALOG_LAST_VERIFIED_AT,
    relatedRetrofitCategories: [
      "attic_insulation",
      "wall_insulation",
      "windows",
      "heat_pump",
      "ventilation",
    ],
  },
];

export function getCatalogEntryByKey(key: string): QuebecEsgIncentiveCatalogEntry | undefined {
  return QUEBEC_ESG_INCENTIVES_CATALOG.find((e) => e.key === key);
}

export function resolveSourceUrl(sourceUrlKey: string): string | null {
  const u = SOURCE_URLS[sourceUrlKey];
  return typeof u === "string" && u.length > 0 ? u : null;
}
