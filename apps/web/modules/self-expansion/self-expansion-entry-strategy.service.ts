import type { ExpansionEntryHub, TerritoryExpansionProfile } from "@/modules/self-expansion/self-expansion.types";
import type { EntryStrategyResult } from "@/modules/self-expansion/self-expansion.types";

function hubsForArchetype(a: TerritoryExpansionProfile["archetype"]): ExpansionEntryHub[] {
  switch (a) {
    case "tourist_corridor":
      return ["BNHUB", "LISTINGS", "BROKER"];
    case "investor_dense":
      return ["INVESTOR", "LISTINGS", "BROKER"];
    case "satellite_commuter":
      return ["BROKER", "LISTINGS", "BNHUB"];
    case "regional_hub":
      return ["LISTINGS", "BROKER", "INVESTOR"];
    case "sprawl_low_density":
      return ["BROKER", "LISTINGS", "RESIDENCE_SERVICES"];
    default:
      return ["BROKER", "LISTINGS", "BNHUB"];
  }
}

/** Deterministic hub ordering from metrics + archetype (approval required before execution). */
export function buildEntryStrategy(p: TerritoryExpansionProfile): EntryStrategyResult {
  const candidates = hubsForArchetype(p.archetype);

  let primary: ExpansionEntryHub = candidates[0];
  const secondary: ExpansionEntryHub[] = [];

  const bnBoost = p.bnhubOpportunity / Math.max(1, p.supplySignals.bnhub + 20);
  const invBoost = p.investorInterest / 120;
  const brokerGap = p.brokerDensity < 38 ? 1 : 0;
  const bnHeavy = p.supplySignals.bnhub < 55 && p.demandSignals.renter > 65;

  if (bnBoost > 0.55 || bnHeavy) primary = "BNHUB";
  else if (invBoost > 0.58) primary = "INVESTOR";
  else if (brokerGap) primary = "BROKER";

  if (candidates[1] && candidates[1] !== primary) secondary.push(candidates[1]);
  if (candidates[2] && candidates[2] !== primary && candidates[2] !== secondary[0]) {
    secondary.push(candidates[2]);
  }

  const targetSegment =
    primary === "BNHUB" ? "Short-stay demand + host acquisition"
    : primary === "INVESTOR" ? "Diligence-ready listings + data room hooks"
    : primary === "RESIDENCE_SERVICES" ? "Operator + residence supply partners"
      : "Licensed brokers + listing velocity";

  const firstActions =
    primary === "BNHUB" ?
      [
        "Inventory sprint with measurable night targets",
        "Route traveler intent to hosted BNHub funnel",
        "Weekly supply quality review",
      ]
    : primary === "INVESTOR" ?
      [
        "Investor digest + inventory alignment workshop",
        "Feature diligence-grade exports",
        "Pair capital allocator advisory queue",
      ]
    : [
        "Broker prospect pipeline with territory routing rules",
        "Recruit listings bundle with SEO city pages",
        "Conversion instrumentation on handoffs",
      ];

  const expectedRisks = [
    p.competitorPressure > 7 ? "Incumbent counter-marketing — enforce differentiated BNHub narrative" : "Demand seasonality misread",
    p.regulatoryReadinessFlags.length ? "Regulatory/config items require counsel sign-off before paid scale" : "Operational bench lag if wins accelerate",
  ];

  return {
    territoryId: p.territoryId,
    entryHub: primary,
    secondaryHub: secondary[0],
    targetSegment,
    firstActions,
    expectedRisks,
    acquisitionMethod:
      primary === "BNHUB" ? "Supply-led pilots with incentive ladder"
      : primary === "INVESTOR" ? "Content-led demand + outbound to allocator network"
        : "Broker partnerships + listing acquisition pods",
    gtmAngle:
      primary === "BNHUB" ? "Travel-intent corridors with measurable host SLAs"
      : "Transaction OS depth for licensee teams",
  };
}
