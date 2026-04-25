#!/usr/bin/env node
/**
 * LECIPM — tag every `model` with // @domain: core|marketplace|compliance|analytics|intelligence
 *
 * Rules: aligned with split-prisma-by-domain (mechanical) + "analytics" sub-bucket
 * (Score, Graph, AI, …) on the former intelligence catch-all. Enums: one header only.
 *
 * Run from apps/web:  node scripts/annotate-prisma-model-domains.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRISMA = path.join(__dirname, "..", "prisma");
const DOMAIN_JSON = path.join(PRISMA, "model-domains.json");
const COUNTS_TXT = path.join(PRISMA, "model-domain-line-counts.txt");

const PARTIALS = [
  "10-core.prisma",
  "20-marketplace.prisma",
  "30-compliance.prisma",
  "40-intelligence.prisma",
];

// --- same classifier as split-prisma-by-domain.mjs (keep in sync manually) -----------------
function domainForModel(name) {
  if (
    /^Bnhub/i.test(name) ||
    /^(Rental(?!Application)|RentalApplication|RentalLease|RentPayment|ExternalListing|ShortTermListing|SharedBooking|PackageBooking|Fsbo)/i.test(
      name
    ) ||
    /^(Listing|Rental|Host|Hotel$|^Room$|Room[A-Z]|[Hh]ost[A-Z]|[Bb]ooking(?!$)|Bkg|Bnb|Stay|Ics|Calendar|Availability|Channel|Ota|Ota|Reserv|Package(?!$))/i.test(
      name
    ) ||
    /^(Property(M|F|D|G|C|I|L|O|R|V)|Property$)(?!I|dentity|Oaciq|Disclosure$|Offer$|Graph|Valuation$)/.test(
      name
    ) ||
    /Property(Media|Fraud(?!C)|Location|Disclosure$|Document$|Valuation$|Graph|Identity(?!$))/i.test(
      name
    ) ||
    /^(Immo|GreenProject|Inmo|Outreach|BrokerGrowth|HostGrowth|Listing(?!Authority)|Market(?!ing|B)|Market(Bnhub|Data|Report|Region|Price|Rent|Price|place|place)|BrokerGrowth)/i.test(
      name
    ) ||
    /^(OrchestratedPayment|HostStripe|PlatformPayment$|UsageCredit|ListingContactLead|Commission$|Referral$|Payout$|Advisory|BuyerRequest$|Dispute$|Fraud$|Fraud(?!Case|Signal))/i.test(
      name
    ) ||
    /^(PropertyOffer|PropertyCounter|RealEstateTransaction$)/i.test(name)
  ) {
    if (/LecipmRegulatory|LecipmRisk$|LecipmForm(?!a)|Oaciq(?!M)|^Compliance(?!$)|SellerDisclosure|Notary$|ClosingPackage/i.test(name)) {
      return "compliance";
    }
    if (/^Trustgraph/i.test(name)) return "intelligence";
    return "marketplace";
  }

  if (
    /^Oaciq/i.test(name) ||
    /^LecipmRegulatory|^LecipmRisk|^LecipmForm|^LecipmMandatory|^LecipmExecutionPipeline|^LecipmLegalDocument|^LecipmPaymentRecord|^LecipmTrustWorkflow/i.test(
      name
    ) ||
    /^(BrokerageContract|BrokerTax|LecipmBrokerLicence|Notary|ClosingPackage|GeneratedDocument|Certificate|Compliance(?!$)|Qa|Escalation|OaciqClause)/i.test(
      name
    ) ||
    /^(SellerDisclosure|PropertyDisclosure$|OaciqTransaction|OaciqClient|OaciqBrokerDecision|OaciqConflict|OaciqCompliance|ComplianceRegulator|ComplianceChecklist|LecipmListingCentris|Declaration)/i.test(
      name
    ) ||
    /^(PropertyIdentity|OwnerIdentity|BrokerIdentity|OrganizationIdentity|ListingAuthority|RealEstateTransaction|PropertyOffer$|PropertyCounter|Transaction(Deposit|Document|Event|Message|Step|Timeline|Identity|Timeline|Step|Event|Document)|Esignature|TrustSafety|Enforcement|Appeal|Abuse|Crisis|BrokerDisclosure|LecipmFormInstance|SellerSupporting|ListingCompliance)/i.test(
      name
    ) ||
    /^(Identity(Verification$|Event|Link|Risk|Proof)|ContactVerification$|DocumentExtraction$|PropertyVerification$|ListingVerification|Verification(?!Case|Signal|Level|Fraud)|BrokerVerification$)/i.test(
      name
    ) ||
    /^(Complaint(?!$)|OperationalControl|SystemAlert|Policy(Rule|Effect)|OaciqClauseLibrary|EarlyUser$|LecipmIdentity)/i.test(
      name
    ) ||
    /^Fraud(?!Case|Alert|Signal|Enforcement|Entity)/.test(name)
  ) {
    if (/^Trustgraph/i.test(name)) return "intelligence";
    if (/^Bnhub/i.test(name)) return "marketplace";
    return "compliance";
  }

  if (
    /^(User$|Session$|UserConsent$|UserLoyalty|UserMemory(?!$)|UserSearch$|UserBehavior|UserPreference|UserJourney|UserIntelligence|UserEvent$|TwoFactor|SavedSearch$|Account)/i.test(
      name
    ) ||
    /^(PlatformCode|PlatformAutonomy|PlatformAutomation|PlatformPayment|LecipmCrm(?!B)|LecipmCrm|Team(Daily|Task)?$|EnterpriseWorkspace|LecipmUserExplainer|LecipmAvatar|LecipmAiOperator$|LecipmDealHistory$|LecipmBrokerAutopilot$|DeveloperApplication$)/i.test(
      name
    ) ||
    /^(Team$|TeamDaily|BrokerApplication$|HostApplication$|Workspace(?!A|C|B)|WorkspaceReferral|WorkspaceCollaboration|WorkspaceDeal|WorkspaceBroker|WorkspaceAudit)/i.test(
      name
    ) ||
    /^(DailyTask|DailyMetric|DailyDm|RevenueSnapshot$|MarketSnapshot$|ContentLicense|SocialAccount$|Broker(Profile|Activity|Crm|Team|Thread|Message|InternalNote|Commission$)|LeadRouting$|LecipmBroker$)/i.test(
      name
    ) ||
    /^(LecipmBroker(?!(Licence|Application))|Mortgage(Expert|Request|Broker|Lead)|Expert(Subscription|Billing|Invoice|Payout|Credits|InApp|Review|\w+))/i.test(
      name
    ) ||
    /^(LecipmCrm(?!ontact))/.test(name)
  ) {
    if (/LecipmRegulatory|Oaciq/i.test(name)) return "compliance";
    if (/^Bnhub/i.test(name)) return "marketplace";
    return "core";
  }
  return "intelligence";
}

/**
 * "Analytics / AI" bucket from CURSOR ORDER — only applied when base === intelligence
 * to avoid reclassifying marketplace/compliance items that also contain e.g. "Metric".
 */
function isAnalyticsName(name) {
  return (
    /(Score$|Scoring|Graph|Embedding|Prediction|Insight$|Snapshot$|Metric$|Uplift|Reinforcement|Autonomy(?!ion)|Counterfactual|Bandit|Simulation|Analyzer|LecipmAi(?!Operator)|LecipmAi$|ListingsAi|ListingAi|Intelligence$|IntelligenceSnapshot|Model[A-Z]|Brain|SearchEvent$|UserBehavior$|UserMemory|Tracking|Experiment$|PolicyWeight|FraudGraph|FraudGrap|_Ai|AiConversion|Rank|Ranking)/i.test(
      name
    ) || /^Trustgraph/i.test(name)
  );
}

function annotateTag(name) {
  const d = domainForModel(name);
  if (d === "intelligence" && isAnalyticsName(name)) return "analytics";
  return d;
}

function injectDomainComments(text) {
  const lines = text.split("\n");
  const stripped = lines.filter((l) => !/^\s*\/\/\s*@domain:\s*/.test(l));
  const out = [];
  for (const line of stripped) {
    const m = line.match(/^model\s+(\w+)\s*\{\s*$/);
    if (m) {
      out.push(`// @domain: ${annotateTag(m[1])}`);
    }
    out.push(line);
  }
  return out.join("\n");
}

function addEnumHeaderIfNeeded(fileName, text) {
  if (fileName !== "00-enums.prisma") return text;
  if (text.includes("@domain: enums (shared)")) return text;
  const h = `// @domain: enums (shared) — copy into per-domain schemas on extraction; Prisma will need duplicates across split clients.
`;
  if (text.startsWith("// ")) {
    return h + text;
  }
  return h + text;
}

function lineCount(s) {
  return s ? s.split("\n").length : 0;
}

function main() {
  const allMap = Object.create(null);
  for (const f of ["00-enums.prisma", ...PARTIALS]) {
    const p = path.join(PRISMA, f);
    if (!fs.existsSync(p)) {
      console.warn("skip (missing):", f);
      continue;
    }
    let t = fs.readFileSync(p, "utf8");
    if (f.startsWith("1") || f.startsWith("2") || f.startsWith("3") || f.startsWith("4")) {
      t = injectDomainComments(t);
    } else {
      t = addEnumHeaderIfNeeded(f, t);
    }
    fs.writeFileSync(p, t, "utf8");
    const models = [...t.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]);
    for (const n of models) {
      allMap[n] = annotateTag(n);
    }
    if (f === "00-enums.prisma") {
      const enums = [...t.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((m) => m[1]);
      for (const e of enums) allMap[`enum:${e}`] = "enums:shared";
    }
  }

  const ordered = Object.keys(allMap)
    .sort()
    .reduce((o, k) => {
      o[k] = allMap[k];
      return o;
    }, Object.create(null));
  fs.writeFileSync(DOMAIN_JSON, JSON.stringify(ordered, null, 2) + "\n", "utf8");

  // Re-read partials: model blocks per @domain (rough, for 5k line budget when extracting)
  const by = { core: 0, marketplace: 0, compliance: 0, analytics: 0, intelligence: 0 };
  for (const f of PARTIALS) {
    const t = fs.readFileSync(path.join(PRISMA, f), "utf8");
    const blockStarts = [...t.matchAll(/\/\/\s*@domain:\s*(\S+)\s*\nmodel\s+(\w+)\s*\{/g)];
    for (let i = 0; i < blockStarts.length; i++) {
      const tag = blockStarts[i][1];
      const start = blockStarts[i].index;
      const end = i + 1 < blockStarts.length ? blockStarts[i + 1].index : t.length;
      const chunk = t.slice(start, end);
      if (by[tag] === undefined) by[tag] = 0;
      by[tag] += lineCount(chunk);
    }
  }
  const report = [
    "# Model block line counts (by // @domain — includes comment + model body) per merge partial",
    "# Budget: < ~5000 lines per future prisma/core/schema.prisma (split further if over)",
    JSON.stringify(by, null, 2),
  ].join("\n");
  fs.writeFileSync(COUNTS_TXT, report + "\n", "utf8");

  console.log("Wrote", path.relative(path.join(__dirname, ".."), DOMAIN_JSON));
  console.log("Wrote", path.relative(path.join(__dirname, ".."), COUNTS_TXT));
  console.log("Domain counts (models):", JSON.stringify(countModelsByTag(allMap), null, 2));
}

function countModelsByTag(m) {
  const c = { core: 0, marketplace: 0, compliance: 0, analytics: 0, intelligence: 0 };
  for (const k of Object.keys(m)) {
    if (k.startsWith("enum:") || m[k] === "enums:shared") continue;
    const t = m[k];
    if (c[t] !== undefined) c[t]++;
  }
  return c;
}

main();
