import type { CountryConfig, MarketEntryStrategy } from "./global.types";

export function explainCountryRollout(c: CountryConfig, s: MarketEntryStrategy): string[] {
  return [
    `Hub mix driven by feature toggles: ${c.activeHubs.join(", ")} — disable in config before go-live if counsel requires.`,
    `Data handling: ${c.dataHandlingMode} — does not replace DPA, SCCs, or residency architecture.`,
    `Primary execution lane: ${s.primaryHub} with cities ${s.entryCities.slice(0, 3).join(", ")}.`,
    `Regulatory flags present: ${c.regulatoryFlags.length} — require human mapping to real obligations.`,
    "Audit: every launch step should be logged in your external GRC/ITSM; this engine stores only lightweight demo state",
  ];
}

export function explainIsolation(): string {
  return (
    "Requests should carry tenant + market scope; analytics slices should filter by `country` dimension in warehouse — " +
    "this module surfaces intent, not RLS."
  );
}
