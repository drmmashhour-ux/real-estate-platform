#!/usr/bin/env node
/**
 * Splits apps/web/prisma/models.prisma into multiple top-level .prisma files
 * (merged by Prisma when using schema: "./prisma" — only *.prisma directly under
 * prisma/ is loaded; subfolders are NOT merged in Prisma 7.8+).
 *
 * Run from apps/web:
 *   node scripts/split-prisma-by-domain.mjs
 *
 * Creates backup, writes:
 *   prisma/00-enums.prisma
 *   prisma/10-core.prisma
 *   prisma/20-marketplace.prisma
 *   prisma/30-compliance.prisma
 *   prisma/40-intelligence.prisma
 *
 * Then remove prisma/models.prisma and run: pnpm exec prisma validate --schema=./prisma
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRISMA = path.join(__dirname, "..", "prisma");
const SOURCE = path.join(PRISMA, "models.prisma");

const HEADER = `// Auto-split from models.prisma — domain buckets for LECIPM (see scripts/split-prisma-by-domain.mjs).
// Merged with prisma/schema.prisma; relations preserved. Do not duplicate models across files.

`;

/**
 * @param {string} name
 * @returns {"core"|"marketplace"|"compliance"|"intelligence"}
 */
function domainForModel(name) {
  // 1) Marketplace: BNHub + listing/commerce (first — pulls Bnhub* away from other buckets)
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

  // 2) Compliance: OACIQ, regulatory, identity chains for closing, non-Bnhub verification
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

  // 3) Core: platform identity, orgs, base CRM, mortgage experts (non-MLS listing)
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

  // 4) Intelligence: AI, deal brain, graph, experiments, rest
  return "intelligence";
}

function extractTopLevelBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(model|enum)\s+(\w+)\s*\{\s*$/);
    if (m) {
      const kind = m[1];
      const name = m[2];
      let depth = 0;
      let j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === "{") depth++;
          if (ch === "}") depth--;
        }
        if (j > i && depth === 0) {
          const body = lines.slice(i, j + 1).join("\n");
          blocks.push({ kind, name, text: body, line: i + 1 });
          i = j + 1;
          break;
        }
      }
      if (j >= lines.length) {
        throw new Error(`Unclosed block at line ${i + 1} (${kind} ${name})`);
      }
      continue;
    }
    i++;
  }
  return blocks;
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error("Missing", SOURCE);
    process.exit(1);
  }
  const raw = fs.readFileSync(SOURCE, "utf8");
  const blocks = extractTopLevelBlocks(raw);

  const enums = blocks.filter((b) => b.kind === "enum");
  const models = blocks.filter((b) => b.kind === "model");

  const byDomain = {
    core: [],
    marketplace: [],
    compliance: [],
    intelligence: [],
  };

  for (const b of models) {
    byDomain[domainForModel(b.name)].push(b);
  }

  const backupDir = path.join(PRISMA, "_split_backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(backupDir, `models.pre-split-${stamp}.txt`);
  fs.copyFileSync(SOURCE, backup);
  console.log("Backed up to", path.relative(path.join(__dirname, ".."), backup));

  const write = (file, parts) => {
    fs.writeFileSync(path.join(PRISMA, file), HEADER + parts.join("\n\n") + "\n", "utf8");
  };

  write(
    "00-enums.prisma",
    enums.map((b) => b.text)
  );
  write(
    "10-core.prisma",
    byDomain.core.map((b) => b.text)
  );
  write(
    "20-marketplace.prisma",
    byDomain.marketplace.map((b) => b.text)
  );
  write(
    "30-compliance.prisma",
    byDomain.compliance.map((b) => b.text)
  );
  write(
    "40-intelligence.prisma",
    byDomain.intelligence.map((b) => b.text)
  );

  console.log("Counts — enums:", enums.length);
  for (const k of Object.keys(byDomain)) {
    console.log(`  ${k}:`, byDomain[k].length);
  }

  // Rename source out of the prisma schema tree (do not load two copies)
  const archived = path.join(backupDir, `models.prisma.archived-${stamp}.txt`);
  fs.renameSync(SOURCE, archived);
  console.log("Moved models.prisma to", path.relative(path.join(__dirname, ".."), archived));
  console.log("Next: pnpm exec prisma validate --schema=./prisma && pnpm exec prisma generate --schema=./prisma");
}

main();
