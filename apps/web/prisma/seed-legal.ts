import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/db";

const SEED_LEGAL_CASE_ROOF_QC_ID = "seed-legal-case-roof-qc-001";

/** Resolved from repo `apps/web` when seed runs via `npx tsx prisma/seed-runner.ts` or package scripts. */
const QC_BROKER_DUTY_CORPUS_FILES = [
  join(process.cwd(), "modules/legal/data/qc-broker-duty-verified-information-roof-course.json"),
  join(process.cwd(), "modules/legal/data/qc-broker-bankruptcy-agency-liability-triplex-course.json"),
] as const;

type CorpusRule = {
  code: string;
  title: string;
  category: string;
  description: string;
  conditions: Record<string, unknown>;
  outcome: string;
  severity: string;
};

type QcCorpusFile = {
  cases: Array<{
    slug: string;
    title: string;
    category: string;
    jurisdiction: string;
    sourceType: string;
    sourceReference?: string;
    summary: string;
    facts: string;
    legalIssues: string;
    decision: string;
    reasoning: string;
    outcome: string;
    sellerLiable: boolean;
    brokerLiable: boolean;
    latentDefect: boolean;
    badFaith: boolean;
    tags: string[];
  }>;
  rules: CorpusRule[];
  mappings: Array<{ caseSlug: string; ruleCode: string }>;
};

function legalRuleIdForCode(code: string): string {
  return `seed-legal-rule-${code}`;
}

/** Course-sourced QC broker duty case + rules (see `modules/legal/data/*.json`). */
export async function seedQcBrokerDutyCorpusFromFile(): Promise<void> {
  for (const corpusPath of QC_BROKER_DUTY_CORPUS_FILES) {
    const raw = readFileSync(corpusPath, "utf8");
    const corpus = JSON.parse(raw) as QcCorpusFile;
    await ingestQcBrokerDutyCorpus(corpus);
  }
}

async function ingestQcBrokerDutyCorpus(corpus: QcCorpusFile): Promise<void> {
  for (const rule of corpus.rules) {
    const id = legalRuleIdForCode(rule.code);
    await prisma.legalRule.upsert({
      where: { id },
      create: {
        id,
        title: rule.title,
        category: rule.category,
        description: rule.description,
        conditions: { ...rule.conditions, ruleCode: rule.code },
        outcome: rule.outcome,
        severity: rule.severity,
        enabled: true,
      },
      update: {
        title: rule.title,
        category: rule.category,
        description: rule.description,
        conditions: { ...rule.conditions, ruleCode: rule.code },
        outcome: rule.outcome,
        severity: rule.severity,
      },
    });
  }

  for (const c of corpus.cases) {
    const ruleIds = corpus.mappings
      .filter((m) => m.caseSlug === c.slug)
      .map((m) => legalRuleIdForCode(m.ruleCode));

    await prisma.legalCase.upsert({
      where: { id: c.slug },
      create: {
        id: c.slug,
        title: c.title,
        jurisdiction: c.jurisdiction,
        category: c.category,
        summary: c.summary,
        facts: c.facts,
        legalIssues: c.legalIssues,
        decision: c.decision,
        reasoning: c.reasoning,
        outcome: c.outcome,
        sellerLiable: c.sellerLiable,
        brokerLiable: c.brokerLiable,
        latentDefect: c.latentDefect,
        badFaith: c.badFaith,
        linkedRuleIds: {
          ruleIds,
          corpusMeta: {
            slug: c.slug,
            tags: c.tags,
            sourceType: c.sourceType,
            sourceReference: c.sourceReference ?? "",
          },
        },
      },
      update: {
        title: c.title,
        jurisdiction: c.jurisdiction,
        category: c.category,
        summary: c.summary,
        facts: c.facts,
        legalIssues: c.legalIssues,
        decision: c.decision,
        reasoning: c.reasoning,
        outcome: c.outcome,
        sellerLiable: c.sellerLiable,
        brokerLiable: c.brokerLiable,
        latentDefect: c.latentDefect,
        badFaith: c.badFaith,
        linkedRuleIds: {
          ruleIds,
          corpusMeta: {
            slug: c.slug,
            tags: c.tags,
            sourceType: c.sourceType,
            sourceReference: c.sourceReference ?? "",
          },
        },
      },
    });
  }
}

export async function runSeedLegal(): Promise<void> {
  await prisma.legalCase.upsert({
    where: { id: SEED_LEGAL_CASE_ROOF_QC_ID },
    create: {
      id: SEED_LEGAL_CASE_ROOF_QC_ID,
      title: "Broker Liability & Latent Defect — Roof Misrepresentation",
      jurisdiction: "QC",
      category: "LATENT_DEFECT",
      summary:
        "Seller misrepresented roof repairs; latent defect and bad faith by omission; broker's duty of means satisfied.",
      facts:
        "Seller stated roof elastomer 2009-2010 but only half roof was repaired. Seller knew but concealed. Buyer relied on info. Inspection limited due to snow.",
      legalIssues: "1. Latent defect? 2. Seller misrepresentation? 3. Broker liability?",
      decision: "Latent defect confirmed. Seller liable. Broker not liable.",
      reasoning:
        "Seller acted in bad faith by omission. Broker fulfilled obligation of means by verifying reasonably and warning buyer.",
      outcome: "Seller pays damages. Broker exonerated.",
      sellerLiable: true,
      brokerLiable: false,
      latentDefect: true,
      badFaith: true,
    },
    update: {
      title: "Broker Liability & Latent Defect — Roof Misrepresentation",
      jurisdiction: "QC",
      category: "LATENT_DEFECT",
      summary:
        "Seller misrepresented roof repairs; latent defect and bad faith by omission; broker's duty of means satisfied.",
      facts:
        "Seller stated roof elastomer 2009-2010 but only half roof was repaired. Seller knew but concealed. Buyer relied on info. Inspection limited due to snow.",
      legalIssues: "1. Latent defect? 2. Seller misrepresentation? 3. Broker liability?",
      decision: "Latent defect confirmed. Seller liable. Broker not liable.",
      reasoning:
        "Seller acted in bad faith by omission. Broker fulfilled obligation of means by verifying reasonably and warning buyer.",
      outcome: "Seller pays damages. Broker exonerated.",
      sellerLiable: true,
      brokerLiable: false,
      latentDefect: true,
      badFaith: true,
    },
  });

  const rules = [
    {
      title: "Broker protection — disclosure & verification",
      category: "BROKER_DUTY",
      description:
        "When the broker disclosed the information source and attempted reasonable verification, broker liability exposure is reduced.",
      conditions: { broker_disclosed_source: true, attempted_verification: true },
      outcome: "brokerLiabilityEstimate = false (exposure reduced)",
      severity: "MEDIUM",
    },
    {
      title: "Seller risk — known defect undisclosed",
      category: "DISCLOSURE",
      description: "Known material defect not disclosed to buyer indicates bad-faith risk.",
      conditions: { known_defect: true, not_disclosed: true },
      outcome: "badFaith = true; riskScore += 50",
      severity: "HIGH",
    },
    {
      title: "Latent defect pattern — hidden serious pre-sale defect",
      category: "LATENT_DEFECT",
      description: "Hidden serious defect existing prior to sale matches latent defect pattern.",
      conditions: { hidden_defect: true, serious: true, prior_to_sale: true },
      outcome: "latentDefect = true",
      severity: "CRITICAL",
    },
  ] as const;

  for (const r of rules) {
    const existing = await prisma.legalRule.findFirst({
      where: { title: r.title, category: r.category },
      select: { id: true },
    });
    if (existing) {
      await prisma.legalRule.update({
        where: { id: existing.id },
        data: r,
      });
    } else {
      await prisma.legalRule.create({ data: r });
    }
  }

  await seedQcBrokerDutyCorpusFromFile();

  console.log("Legal Hub seed: LegalCase + LegalRule library rows ensured.");
}
