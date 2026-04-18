export function getSimulationExplainerMarkdown(): string {
  return [
    "## LECIPM launch revenue simulation — disclosure",
    "",
    "- **All figures are projections** unless your dashboard explicitly labels **actuals** from production ledgers.",
    "- **Assumptions** are editable and should be reviewed by finance before investor distribution.",
    "- **BNHub** lodging GMV uses listings × 30 × occupancy × ADR; platform booking revenue applies a single fee-% proxy to GMV.",
    "- **Brokerage** revenue uses configurable lead prices and success-fee share on assumed average gross commission.",
    "- **No traction is fabricated** — if you have real KPIs, paste them as a separate “Actuals” section in the pitch export.",
  ].join("\n");
}
