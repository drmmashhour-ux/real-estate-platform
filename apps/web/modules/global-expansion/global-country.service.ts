import { countries as baseCountries, type CountryDefinition } from "@/config/countries";
import { buildCityLaunchFullView } from "@/modules/city-launch/city-launch.service";
import { buildMarketDominationSnapshot } from "@/modules/market-domination/market-domination.service";
import { getRevenuePredictorAdminSummary } from "@/modules/revenue-predictor/revenue-predictor.service";
import { runGrowthBrainSnapshot } from "@/modules/growth-brain/growth-brain.service";

import { getRegulationView } from "./global-regulation.service";
import { explainCountryRollout } from "./global-explainability.service";

import type {
  CountryConfig,
  CountryDetailView,
  GlobalCountryPerformance,
  GlobalDashboardSnapshot,
  GlobalExpansionAlert,
  MarketEntryStrategy,
} from "./global.types";

const STORAGE_KEY = "lecipm-global-expansion-v1";

type StoredState = {
  expansionStatus: Record<string, "planning" | "active" | "scaling" | "paused">;
  readinessOverride: Record<string, number>;
  performanceProxy: Record<string, GlobalCountryPerformance>;
  launchLog: Record<string, { launchedAtIso: string; steps: string[] }>;
};

let mem: StoredState = {
  expansionStatus: {},
  readinessOverride: {},
  performanceProxy: {},
  launchLog: {},
};

function load(): StoredState {
  if (typeof localStorage !== "undefined") {
    try {
      const r = localStorage.getItem(STORAGE_KEY);
      if (r) mem = { ...mem, ...JSON.parse(r) } as StoredState;
    } catch {
      /* ignore */
    }
  }
  return mem;
}

function save(s: Partial<StoredState>): void {
  mem = { ...load(), ...s };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
    } catch {
      /* quota */
    }
  }
}

export function resetGlobalExpansionStateForTests(): void {
  mem = {
    expansionStatus: {},
    readinessOverride: {},
    performanceProxy: {},
    launchLog: {},
  };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

function hubKeysFromDef(f: CountryDefinition["features"]): import("./global.types").HubKey[] {
  const h: import("./global.types").HubKey[] = ["BUYER", "SELLER", "BROKER"];
  if (f.BNHub) h.push("BNHUB");
  if (f.mortgageHub) h.push("MORTGAGE");
  if (f.insuranceHub) h.push("INSURANCE");
  return h;
}

function featureKeysFromDef(f: CountryDefinition["features"]): import("./global.types").FeatureKey[] {
  const out: import("./global.types").FeatureKey[] = ["listings", "acquisition_crm"];
  if (f.BNHub) out.push("bnhub");
  if (f.mortgageHub) out.push("mortgage_hub");
  if (f.insuranceHub) out.push("insurance_hub");
  return out;
}

/** Merge platform country definitions with expansion metadata */
export function toCountryConfig(def: CountryDefinition, extra?: Partial<CountryConfig>): CountryConfig {
  const code = def.code;
  const store = load();
  const st =
    store.expansionStatus[code] ?? (code === "CA" || code === "SY" ? "active" : "planning");
  const score =
    store.readinessOverride[code] ??
    (st === "active" ? 78 : st === "scaling" ? 88 : st === "paused" ? 40 : 52);

  return {
    countryCode: code,
    name: def.name,
    supportedCities: extra?.supportedCities ?? defaultCitiesFor(code),
    defaultLanguage: def.defaultLanguage,
    supportedLanguages: [...def.languages],
    currency: def.currency,
    timezone: extra?.timezone ?? (code === "CA" ? "America/Toronto" : code === "SY" ? "Asia/Damascus" : "UTC"),
    activeHubs: extra?.activeHubs ?? hubKeysFromDef(def.features),
    enabledFeatures: extra?.enabledFeatures ?? featureKeysFromDef(def.features),
    regulatoryFlags: extra?.regulatoryFlags ?? defaultFlagsFor(code),
    paymentProvider: def.paymentProvider,
    contactRules:
      extra?.contactRules ??
      "Configure consent, quiet hours, and channel limits per product counsel — templates only here.",
    dataHandlingMode: extra?.dataHandlingMode ?? (code === "CA" ? "STRICT_PII" : "STANDARD"),
    expansionStatus: (extra?.expansionStatus as CountryConfig["expansionStatus"]) ?? st,
    expansionReadinessScore: extra?.expansionReadinessScore ?? score,
  };
}

function defaultCitiesFor(code: string): string[] {
  if (code === "CA") return ["Montréal", "Toronto", "Calgary", "Vancouver", "Québec"];
  if (code === "SY") return ["Damascus", "Aleppo", "Latakia"];
  if (code === "FR") return ["Paris", "Lyon", "Marseille"];
  if (code === "AE") return ["Dubai", "Abu Dhabi"];
  return [];
}

function defaultFlagsFor(code: string): string[] {
  if (code === "CA") return ["PROVINCIAL_BROKER_REG", "PRIVACY_PIPEDA_AWARE", "ADVERTISING_DISCLOSURE"];
  if (code === "SY") return ["CROSS_BORDER_SANCTIONS_REVIEW", "MANUAL_PAYMENTS", "CRISIS_MESSAGING_REVIEW"];
  return ["JURISDICTION_REVIEW_REQUIRED"];
}

export function allBaseCountryConfigs(): CountryConfig[] {
  return Object.values(baseCountries).map((d) => toCountryConfig(d));
}

export function getCountryConfig(countryCode: string): CountryConfig | undefined {
  const upper = countryCode.toUpperCase();
  const def = Object.values(baseCountries).find((c) => c.code === upper);
  if (def) return toCountryConfig(def);
  if (PLANNING_ONLY[upper]) return PLANNING_ONLY[upper];
  return undefined;
}

/** Planning entries not yet in main routing */
const PLANNING_ONLY: Record<string, CountryConfig> = {
  FR: {
    countryCode: "FR",
    name: "France",
    supportedCities: ["Paris", "Lyon", "Marseille", "Bordeaux"],
    defaultLanguage: "fr",
    supportedLanguages: ["fr", "en"],
    currency: "EUR",
    timezone: "Europe/Paris",
    activeHubs: ["BUYER", "SELLER", "BROKER", "INVESTOR", "BNHUB"],
    enabledFeatures: ["listings", "bnhub", "investor_portal", "acquisition_crm", "autonomous_marketing"],
    regulatoryFlags: ["GDPR", "MISC_CONSUMER_TEMPLATES", "BROKER_ORIAS_STYLE_REVIEW"],
    paymentProvider: "stripe",
    contactRules: "Template: French marketing + cookie consent must be policy-reviewed before enable.",
    dataHandlingMode: "REGIONAL_RESIDENCY_HINT",
    expansionStatus: "planning",
    expansionReadinessScore: 48,
  },
  AE: {
    countryCode: "AE",
    name: "United Arab Emirates",
    supportedCities: ["Dubai", "Abu Dhabi", "Sharjah"],
    defaultLanguage: "en",
    supportedLanguages: ["en", "ar"],
    currency: "AED",
    timezone: "Asia/Dubai",
    activeHubs: ["BUYER", "BROKER", "INVESTOR", "BNHUB", "MORTGAGE"],
    enabledFeatures: [
      "listings",
      "bnhub",
      "investor_portal",
      "mortgage_hub",
      "acquisition_crm",
      "autonomous_marketing",
    ],
    regulatoryFlags: ["DLD_DUBAI_STYLE_REVIEW", "RERA_AWARE", "TAX_NEXUS_REVIEW"],
    paymentProvider: "stripe",
    contactRules: "Template: GCC marketing compliance + WhatsApp use policy to be set per counsel.",
    dataHandlingMode: "STRICT_PII",
    expansionStatus: "planning",
    expansionReadinessScore: 55,
  },
};

export function listAllCountryConfigsForExpansion(): CountryConfig[] {
  const fromBase = allBaseCountryConfigs();
  const codes = new Set(fromBase.map((c) => c.countryCode));
  const extra = [PLANNING_ONLY.FR, PLANNING_ONLY.AE].filter((c) => c && !codes.has(c.countryCode));
  return [...fromBase, ...extra].sort((a, b) => a.name.localeCompare(b.name));
}

export function marketEntryStrategyFor(countryCode: string): MarketEntryStrategy {
  const c = getCountryConfig(countryCode);
  if (!c) {
    return {
      countryCode,
      entryCities: [],
      primaryHub: "BROKER",
      targetAudience: "Unknown",
      initialMarketingStrategy: "Define ICP and counsel review",
      salesApproach: "Pilot with tight governance",
    };
  }
  return {
    countryCode: c.countryCode,
    entryCities: c.supportedCities.slice(0, 4),
    primaryHub: c.activeHubs.includes("BNHUB")
      ? "BNHUB"
      : c.activeHubs.includes("INVESTOR")
        ? "INVESTOR"
        : "BROKER",
    targetAudience: "Prime movers in urban cores + expat/property investors where allowed",
    initialMarketingStrategy: "Phased: localized content → broker social proof → demand capture (policy gated)",
    salesApproach: "High-touch partner onboarding, routed intent over cold lists",
  };
}

function performanceForCountry(code: string): GlobalCountryPerformance {
  const st = load();
  if (st.performanceProxy[code]) return st.performanceProxy[code]!;
  const hash = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    countryCode: code,
    revenueCentsProxy: 400_000_000 + (hash % 5) * 50_000_000,
    leadsProxy: 200 + (hash % 120),
    growthRateProxy: 0.04 + (hash % 20) / 200,
    lastUpdatedIso: new Date().toISOString(),
  };
}

export function buildGlobalDashboardSnapshot(): GlobalDashboardSnapshot {
  const all = listAllCountryConfigsForExpansion();
  const pipeline = all
    .map((c) => ({
      countryCode: c.countryCode,
      name: c.name,
      expansionReadinessScore: c.expansionReadinessScore,
      status: c.expansionStatus,
    }))
    .sort((a, b) => b.expansionReadinessScore - a.expansionReadinessScore);

  const performance = all.map((c) => performanceForCountry(c.countryCode));
  const alerts = buildGlobalAlertsInternal(all, performance);

  return {
    generatedAtIso: new Date().toISOString(),
    countries: all.map((c) => ({ ...c, strategy: marketEntryStrategyFor(c.countryCode) })),
    pipeline,
    performance,
    alerts,
    dataIsolationNote:
      "Logical separation by market is enforced in routing and tenant scoping; back data residency decisions with infrastructure design — this UI is awareness only.",
  };
}

function buildGlobalAlertsInternal(
  all: CountryConfig[],
  performance: GlobalCountryPerformance[]
): GlobalExpansionAlert[] {
  const out: GlobalExpansionAlert[] = [];
  for (const c of all) {
    if (c.expansionStatus === "planning" && c.expansionReadinessScore >= 70) {
      out.push({
        id: `gex-ready-${c.countryCode}`,
        kind: "country_ready",
        countryCode: c.countryCode,
        title: `${c.name} approaches launch readiness (score ${c.expansionReadinessScore})`,
        body: "Review regulation view + country counsel before flipping status to active.",
        severity: "info",
      });
    }
    if (c.regulatoryFlags.some((f) => f.includes("CONFLICT") || f.includes("SANCTIONS"))) {
      out.push({
        id: `gex-reg-${c.countryCode}`,
        kind: "regulatory_conflict",
        countryCode: c.countryCode,
        title: `High-attention flags for ${c.name}`,
        body: c.regulatoryFlags.join(", ") + " — requires compliance review, not just config toggles.",
        severity: "important",
      });
    }
  }
  for (const p of performance) {
    if (p.growthRateProxy > 0.12) {
      out.push({
        id: `gex-growth-${p.countryCode}`,
        kind: "rapid_growth",
        countryCode: p.countryCode,
        title: `Rapid growth signal (proxy) — ${p.countryCode}`,
        body: "Revenue/lead momentum elevated vs baseline — ensure ops and compliance capacity.",
        severity: "watch",
      });
    }
    if (p.growthRateProxy < 0.01) {
      out.push({
        id: `gex-slow-${p.countryCode}`,
        kind: "underperformance",
        countryCode: p.countryCode,
        title: `Underperformance risk (proxy) — ${p.countryCode}`,
        body: "Investigate demand, routing, and market narrative before further spend.",
        severity: "watch",
      });
    }
  }
  return out.slice(0, 25);
}

export function buildCountryDetailView(countryCode: string): CountryDetailView | null {
  const c = getCountryConfig(countryCode);
  if (!c) return null;
  const strategy = marketEntryStrategyFor(countryCode);
  const regulation = getRegulationViewFromConfig(c);
  const performance = performanceForCountry(countryCode);
  const st = load();
  const log = st.launchLog[countryCode] ?? null;

  let mDom = "Market Domination: run per-territory views filtered to this market in admin.";
  let cLaunch = "City Launch: open city playbooks for cities listed in country config.";
  let gBrain = "Growth Brain: org-wide signals; filter initiatives by team assignments per market.";
  let revP = "Revenue Predictor: org rollup — allocate attribution by market in finance tooling.";
  try {
    buildMarketDominationSnapshot();
    mDom = "Snapshot available — compare territory cards against this country’s target cities.";
  } catch {
    /* noop */
  }
  try {
    const v = buildCityLaunchFullView("mtl-core");
    if (v) cLaunch = `Playbook engine active; tie ${c.supportedCities[0] ?? "pilot city"} to launch steps.`;
  } catch {
    /* noop */
  }
  try {
    runGrowthBrainSnapshot();
    gBrain = "Brain snapshot generated — use opportunities aligned to regional workstreams.";
  } catch {
    /* noop */
  }
  try {
    getRevenuePredictorAdminSummary();
    revP = "Forecast + alerts available — do not equate to GAAP; segment by market in reporting.";
  } catch {
    /* noop */
  }

  return {
    country: c,
    strategy,
    regulation,
    performance,
    integrationNotes: {
      marketDomination: mDom,
      cityLaunch: cLaunch,
      growthBrain: gBrain,
      revenuePredictor: revP,
    },
    launchHistory: log
      ? {
          launchedAtIso: log.launchedAtIso,
          stepsCompleted: log.steps,
          auditLine: `Launch record for ${countryCode} at ${log.launchedAtIso}`,
        }
      : null,
    explainability: explainCountryRollout(c, strategy),
  };
}

export function setCountryExpansionStatus(
  countryCode: string,
  status: CountryConfig["expansionStatus"]
): void {
  const s = load();
  s.expansionStatus[countryCode.toUpperCase()] = status;
  save(s);
}

export function recordPerformanceProxy(p: GlobalCountryPerformance): void {
  const s = load();
  s.performanceProxy[p.countryCode] = p;
  save(s);
}

export function recordCountryLaunch(countryCode: string, steps: string[]): void {
  const s = load();
  s.launchLog[countryCode.toUpperCase()] = {
    launchedAtIso: new Date().toISOString(),
    steps,
  };
  save(s);
}

export async function launchCountry(countryCode: string, actorUserId: string | null) {
  recordCountryLaunch(countryCode, ["INITIAL_SCOPING", "LEGAL_REVIEW_STARTED"]);
  setCountryExpansionStatus(countryCode, "active");
  return { success: true, countryCode };
}
