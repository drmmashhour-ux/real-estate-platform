/**
 * Illustrative Québec-oriented grant/subsidy references — not exhaustive or legally binding.
 * Amounts and rules change; users must verify with official sources.
 */

export type GrantTag =
  | "heat_pump"
  | "insulation_envelope"
  | "windows_glazing"
  | "solar_pv"
  | "ventilation_hrv_erv"
  | "air_sealing"
  | "oil_heating_transition"
  | "energy_audit"
  | "deep_retrofit";

export type QuebecGrantRecord = {
  id: string;
  name: string;
  /** Tags — grant shown when any tag matches planned upgrades or property context */
  eligibility: GrantTag[];
  region: string;
  /** Display tier or descriptive range — not a quote */
  amount: string;
  howToApply: string;
};

export const QUEBEC_GRANTS_SEED: QuebecGrantRecord[] = [
  {
    id: "chauffez-vert-style",
    name: "Oil / fossil heating → efficient electric (e.g. Chauffez vert–style programs)",
    eligibility: ["heat_pump", "oil_heating_transition"],
    region: "Quebec",
    amount: "$$$–$$$$ (equipment & household criteria)",
    howToApply:
      "Confirm eligibility on the official Québec program portal with a RBQ-certified contractor before work begins. Quotes usually required.",
  },
  {
    id: "renoclimat-style-envelope",
    name: "Whole-home renovation & insulation (Rénoclimat-style envelope support)",
    eligibility: ["insulation_envelope", "deep_retrofit", "energy_audit"],
    region: "Quebec",
    amount: "$$$ (steps depend on audit)",
    howToApply:
      "Often starts with an approved energy evaluation; follow the official workflow and keep invoices for subsidized measures.",
  },
  {
    id: "hydro-hp-participate",
    name: "Heat pump participation / efficiency initiatives (utility-linked)",
    eligibility: ["heat_pump"],
    region: "Quebec",
    amount: "$$–$$$",
    howToApply:
      "Check Hydro-Québec and participating distributor listings for equipment classes covered in the current cycle.",
  },
  {
    id: "window-insulation-retrofit",
    name: "High-performance windows & envelope improvements",
    eligibility: ["windows_glazing", "insulation_envelope"],
    region: "Quebec",
    amount: "$$–$$$",
    howToApply:
      "Bundled with renovation or audit programs — verify measure lists each year on official program documentation.",
  },
  {
    id: "solar-net-metering",
    name: "Solar PV incentives & net metering participation",
    eligibility: ["solar_pv"],
    region: "Quebec",
    amount: "$$–$$$",
    howToApply:
      "Coordinate with utility interconnection rules and any concurrent provincial rebate windows for eligible equipment.",
  },
  {
    id: "hrv-erv-ventilation",
    name: "Ventilation upgrades (HRV/ERV) with retrofit bundles",
    eligibility: ["ventilation_hrv_erv", "air_sealing"],
    region: "Quebec",
    amount: "$–$$",
    howToApply:
      "Often combined with air sealing or audit-track renovations — confirm with evaluator and official measure catalog.",
  },
];
